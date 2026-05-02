"use client";

import Image from "next/image";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  buildAdminLiquorInfoFormState,
  COMMON_WHISKY_TYPES,
  EMPTY_ADMIN_LIQUOR_INFO_FORM,
  formatAdminLiquorSummary,
  type AdminLiquorInfoFormState,
  type AdminLiquorInfoItem,
  type AdminLiquorInfoPage,
} from "../model/admin-liquor-info";

const PAGE_SIZE = 20;
const DEFAULT_IMAGE_URL =
  "https://jeqvxzkvumkiraclauvo.supabase.co/storage/v1/object/public/whisky-images/default_whisky.webp";
const CATEGORY_OPTIONS = [
  "Whisky",
  "싱글몰트",
  "블렌디드",
  "스페이사이드 싱글몰트",
  "하이랜드 싱글몰트",
  "아일라 싱글몰트",
  "버번",
  "Single Malt",
  "Blended",
  "Bourbon",
  "Brandy",
  "Rum",
  "Gin",
  "Vodka",
  "Tequila",
];

function isHttpImageUrl(value: string) {
  if (!value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDateTime(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface FieldProps {
  label: string;
  name: keyof AdminLiquorInfoFormState;
  value: string;
  onChange: (name: keyof AdminLiquorInfoFormState, value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url";
  required?: boolean;
  datalistId?: string;
  inputMode?: "decimal" | "numeric";
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  datalistId,
  inputMode,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase text-[color:var(--catalog-muted)]">
        {label}
      </span>
      <input
        type={type}
        required={required}
        inputMode={inputMode}
        list={datalistId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full rounded-lg border border-[color:rgba(216,195,180,0.62)] bg-white px-3 py-2.5 text-sm text-[color:var(--catalog-ink)] outline-none transition placeholder:text-[color:rgba(82,68,57,0.44)] focus:border-[color:var(--catalog-primary)] focus:ring-2 focus:ring-[color:rgba(139,74,44,0.12)]"
      />
    </label>
  );
}

export default function AdminLiquorInfoEditor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<AdminLiquorInfoItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminLiquorInfoItem | null>(null);
  const [form, setForm] = useState<AdminLiquorInfoFormState>(EMPTY_ADMIN_LIQUOR_INFO_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(0);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLiquors() {
      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams({
          q: debouncedSearchQuery,
          page: String(page),
          size: String(PAGE_SIZE),
        });
        const response = await fetch(`/api/admin/liquors?${searchParams.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("상품 정보를 불러오지 못했습니다.");
        }

        const data = (await response.json()) as AdminLiquorInfoPage;
        if (controller.signal.aborted) {
          return;
        }

        setItems((current) => (page === 0 ? data.items : [...current, ...data.items]));
        setHasNext(data.hasNext);

        if (page === 0 && data.items.length > 0) {
          setSelectedItem((current) => {
            const stillVisible = current ? data.items.some((item) => item.id === current.id) : false;
            const nextItem = stillVisible ? current : data.items[0] ?? null;
            setForm(nextItem ? buildAdminLiquorInfoFormState(nextItem) : EMPTY_ADMIN_LIQUOR_INFO_FORM);
            return nextItem;
          });
        }

        if (page === 0 && data.items.length === 0) {
          setSelectedItem(null);
          setForm(EMPTY_ADMIN_LIQUOR_INFO_FORM);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          console.error("Failed to load admin liquors", loadError);
          setError(loadError instanceof Error ? loadError.message : "상품 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLiquors();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchQuery, page]);

  const previewImageUrl = useMemo(() => {
    return isHttpImageUrl(form.image_url) ? form.image_url : DEFAULT_IMAGE_URL;
  }, [form.image_url]);

  function handleSelect(item: AdminLiquorInfoItem) {
    setSelectedItem(item);
    setForm(buildAdminLiquorInfoFormState(item));
    setSaveMessage(null);
    setError(null);
  }

  function handleFieldChange(name: keyof AdminLiquorInfoFormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setSaveMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      const response = await fetch(`/api/admin/liquors/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as AdminLiquorInfoItem | { message?: string };
      if (!response.ok) {
        throw new Error("message" in result && result.message ? result.message : "상품 정보 수정 실패");
      }

      const updatedItem = result as AdminLiquorInfoItem;
      setItems((current) => current.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      setSelectedItem(updatedItem);
      setForm(buildAdminLiquorInfoFormState(updatedItem));
      setSaveMessage("저장되었습니다.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "상품 정보 수정 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!selectedItem || !file) {
      return;
    }

    try {
      setImageUploading(true);
      setError(null);
      setSaveMessage(null);

      const body = new FormData();
      body.append("image", file);

      const response = await fetch(`/api/admin/liquors/${selectedItem.id}/image`, {
        method: "POST",
        body,
      });
      const result = (await response.json()) as AdminLiquorInfoItem | { message?: string };

      if (!response.ok) {
        throw new Error("message" in result && result.message ? result.message : "이미지 업로드 실패");
      }

      const updatedItem = result as AdminLiquorInfoItem;
      setItems((current) => current.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      setSelectedItem(updatedItem);
      setForm(buildAdminLiquorInfoFormState(updatedItem));
      setSaveMessage("이미지가 업로드되고 DB에 반영되었습니다.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "이미지 업로드 실패");
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--catalog-bg-solid)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[color:rgba(216,195,180,0.42)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="catalog-kicker">Admin</p>
            <h1 className="catalog-editorial mt-2 text-4xl font-medium italic leading-tight text-[color:var(--catalog-ink)]">
              상품 정보 수정
            </h1>
          </div>
          <a
            href="/admin/manual-entry"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:rgba(139,74,44,0.34)] bg-white px-4 text-sm font-bold text-[color:var(--catalog-primary)] transition hover:bg-[color:var(--catalog-bg-secondary)]"
          >
            가격 입력
          </a>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
          <aside className="rounded-xl border border-[color:rgba(216,195,180,0.46)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_18px_42px_rgba(28,28,23,0.05)]">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase text-[color:var(--catalog-muted)]">
                주류 검색
              </span>
              <input
                type="search"
                value={searchQuery}
                placeholder="상품명, 브랜드, 코드"
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-[color:rgba(216,195,180,0.62)] bg-white px-3 py-2.5 text-sm text-[color:var(--catalog-ink)] outline-none transition focus:border-[color:var(--catalog-primary)] focus:ring-2 focus:ring-[color:rgba(139,74,44,0.12)]"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      isSelected
                        ? "border-[color:rgba(139,74,44,0.64)] bg-[color:var(--catalog-bg-secondary)]"
                        : "border-[color:rgba(216,195,180,0.34)] bg-white hover:border-[color:rgba(139,74,44,0.32)]"
                    }`}
                  >
                    <span className="line-clamp-2 block text-sm font-bold text-[color:var(--catalog-ink)]">
                      {item.product_name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[color:var(--catalog-muted)]">
                      {formatAdminLiquorSummary(item) || item.product_code || `ID ${item.id}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[color:var(--catalog-muted)]">
                {loading ? "불러오는 중" : `${items.length.toLocaleString("ko-KR")}개`}
              </span>
              <button
                type="button"
                disabled={!hasNext || loading}
                onClick={() => setPage((current) => current + 1)}
                className="h-9 rounded-lg bg-[color:var(--catalog-ink)] px-3 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[color:rgba(82,68,57,0.28)]"
              >
                더 보기
              </button>
            </div>
          </aside>

          <section className="rounded-xl border border-[color:rgba(216,195,180,0.46)] bg-[rgba(255,255,255,0.84)] p-4 shadow-[0_18px_42px_rgba(28,28,23,0.05)] sm:p-5">
            {selectedItem ? (
              <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[color:rgba(216,195,180,0.38)] bg-white">
                    <Image
                      src={previewImageUrl}
                      alt={form.product_name || selectedItem.product_name}
                      fill
                      sizes="(max-width: 1280px) 100vw, 24rem"
                      className="object-contain p-6"
                      unoptimized
                    />
                  </div>
                  <div className="mt-4 rounded-lg bg-[color:var(--catalog-bg-secondary)] px-3 py-3">
                    <p className="text-sm font-bold text-[color:var(--catalog-ink)]">{selectedItem.product_name}</p>
                    <p className="mt-1 text-xs text-[color:var(--catalog-muted)]">
                      {selectedItem.product_code || `ID ${selectedItem.id}`}
                    </p>
                    <label className="mt-4 flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[color:var(--catalog-ink)] px-3 text-xs font-bold text-white transition hover:bg-[color:var(--catalog-muted)]">
                      {imageUploading ? "업로드 중" : "사진 업로드"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                        disabled={imageUploading}
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                    {selectedItem.updated_at && (
                      <p className="mt-3 text-[11px] font-semibold text-[color:var(--catalog-soft)]">
                        {formatDateTime(selectedItem.updated_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <datalist id="admin-liquor-category-options">
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <datalist id="admin-liquor-type-options">
                    {COMMON_WHISKY_TYPES.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="상품명"
                      name="product_name"
                      value={form.product_name}
                      onChange={handleFieldChange}
                      required
                    />
                    <Field
                      label="정규화 이름"
                      name="normalized_name"
                      value={form.normalized_name}
                      onChange={handleFieldChange}
                      required
                    />
                    <Field label="브랜드" name="brand" value={form.brand} onChange={handleFieldChange} />
                    <Field
                      label="노출 종류"
                      name="category"
                      value={form.category}
                      onChange={handleFieldChange}
                      datalistId="admin-liquor-category-options"
                    />
                    <Field
                      label="세부 분류"
                      name="clazz"
                      value={form.clazz}
                      onChange={handleFieldChange}
                      datalistId="admin-liquor-type-options"
                    />
                    <Field label="국가" name="country" value={form.country} onChange={handleFieldChange} />
                    <Field
                      label="용량 ml"
                      name="volume_ml"
                      value={form.volume_ml}
                      onChange={handleFieldChange}
                      type="number"
                      inputMode="numeric"
                    />
                    <Field
                      label="도수 %"
                      name="alcohol_percent"
                      value={form.alcohol_percent}
                      onChange={handleFieldChange}
                      type="number"
                      inputMode="decimal"
                    />
                    <div className="md:col-span-2">
                      <span className="mb-2 block text-[11px] font-bold uppercase text-[color:var(--catalog-muted)]">
                        현재 이미지
                      </span>
                      <a
                        href={form.image_url || previewImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-[color:rgba(216,195,180,0.62)] bg-[color:var(--catalog-bg-secondary)] px-3 py-2.5 text-xs font-semibold text-[color:var(--catalog-primary)] break-all"
                      >
                        {form.image_url || "기본 이미지"}
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border-t border-[color:rgba(216,195,180,0.34)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-h-5">
                      {saveMessage && <p className="text-sm font-bold text-green-700">{saveMessage}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-11 rounded-lg bg-[color:var(--catalog-primary)] px-5 text-sm font-bold text-white transition hover:bg-[color:var(--catalog-primary-strong)] disabled:cursor-wait disabled:opacity-60"
                    >
                      {saving ? "저장 중" : "저장"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center rounded-xl bg-[color:var(--catalog-bg-secondary)] px-6 text-center">
                <p className="text-sm font-semibold text-[color:var(--catalog-muted)]">
                  {loading ? "불러오는 중" : "수정할 상품이 없습니다."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
