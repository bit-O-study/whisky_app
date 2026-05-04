import { getSupabaseClient } from "../../../../lib/supabase";
import type { AdminLiquorInfoItem, AdminLiquorInfoPage } from "../model/admin-liquor-info";

interface FetchAdminLiquorInfoPageParams {
  keyword?: string;
  page: number;
  size: number;
}

export interface AdminLiquorInfoUpdateInput {
  product_name?: unknown;
  normalized_name?: unknown;
  brand?: unknown;
  category?: unknown;
  clazz?: unknown;
  country?: unknown;
  volume_ml?: unknown;
  alcohol_percent?: unknown;
  image_url?: unknown;
}

export interface AdminLiquorImageUploadFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface AdminLiquorInfoRow {
  id: number;
  product_code: string | null;
  product_name: string | null;
  normalized_name: string | null;
  brand: string | null;
  category: string | null;
  class: string | null;
  country: string | null;
  volume_ml: number | null;
  alcohol_percent: number | null;
  image_url: string | null;
  updated_at: string | null;
}

interface QueryError {
  code?: string;
  message?: string;
}

interface QueryResponse<T> {
  data: T[] | null;
  error: QueryError | null;
  status?: number;
}

interface MutateResponse<T> {
  data: T | null;
  error: QueryError | null;
  status?: number;
}

interface AdminLiquorInfoListQuery<T> extends PromiseLike<QueryResponse<T>> {
  select(columns: string): AdminLiquorInfoListQuery<T>;
  order(column: string, options: { ascending: boolean }): AdminLiquorInfoListQuery<T>;
  range(from: number, to: number): AdminLiquorInfoListQuery<T>;
  or(filter: string): AdminLiquorInfoListQuery<T>;
}

interface AdminLiquorInfoMutationQuery<T> extends PromiseLike<MutateResponse<T>> {
  update(values: Record<string, string | number | null>): AdminLiquorInfoMutationQuery<T>;
  eq(column: string, value: number): AdminLiquorInfoMutationQuery<T>;
  select(columns: string): AdminLiquorInfoMutationQuery<T>;
  single(): AdminLiquorInfoMutationQuery<T>;
}

interface AdminLiquorInfoSupabaseClient {
  from(table: "liquor"): unknown;
}

interface AdminStorageBucketClient {
  upload(
    path: string,
    body: ArrayBuffer,
    options: { cacheControl: string; contentType: string; upsert: boolean },
  ): Promise<{ data: { path?: string } | null; error: QueryError | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
}

interface AdminLiquorImageStorageClient extends AdminLiquorInfoSupabaseClient {
  storage: {
    from(bucket: string): AdminStorageBucketClient;
  };
}

const ADMIN_LIQUOR_SELECT =
  "id, product_code, product_name, normalized_name, brand, category, class, country, volume_ml, alcohol_percent, image_url, updated_at";
const DEFAULT_ADMIN_IMAGE_BUCKET = "whisky-images";
const MAX_ADMIN_IMAGE_BYTES = 6 * 1024 * 1024;
const ADMIN_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function normalizeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function clampPage(value: number) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function clampSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 20;
  }

  return Math.min(Math.floor(value), 50);
}

function escapeAdminSearchKeyword(keyword: string) {
  return keyword.replace(/[%_,]/g, "\\$&");
}

export function buildAdminLiquorSearchFilter(keyword: string) {
  const escaped = escapeAdminSearchKeyword(keyword.trim());
  return [
    `product_name.ilike.%${escaped}%`,
    `normalized_name.ilike.%${escaped}%`,
    `brand.ilike.%${escaped}%`,
    `product_code.ilike.%${escaped}%`,
  ].join(",");
}

export function mapAdminLiquorInfoRow(row: AdminLiquorInfoRow): AdminLiquorInfoItem {
  return {
    id: row.id,
    product_code: normalizeText(row.product_code),
    product_name: normalizeText(row.product_name) || normalizeText(row.normalized_name, "이름 없음"),
    normalized_name: normalizeText(row.normalized_name),
    brand: normalizeText(row.brand),
    category: normalizeText(row.category),
    clazz: normalizeText(row.class),
    country: normalizeText(row.country),
    volume_ml: typeof row.volume_ml === "number" && Number.isFinite(row.volume_ml) ? row.volume_ml : null,
    alcohol_percent:
      typeof row.alcohol_percent === "number" && Number.isFinite(row.alcohol_percent) ? row.alcohol_percent : null,
    image_url: normalizeText(row.image_url),
    updated_at: normalizeText(row.updated_at),
  };
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: unknown, fieldName: string) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new Error(`${fieldName}은 필수입니다.`);
  }

  return normalized;
}

function normalizeOptionalNumber(value: unknown, fieldName: string, max: number) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > max) {
    throw new Error(`${fieldName} 값이 올바르지 않습니다.`);
  }

  return numberValue;
}

function normalizeImageUrl(value: unknown) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error("이미지 URL은 http 또는 https URL이어야 합니다.");
  }

  return normalized;
}

function normalizeLiquorId(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("수정할 주류 ID가 올바르지 않습니다.");
  }

  return Math.floor(id);
}

function sanitizeStorageFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  const safeName = nameWithoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return safeName || "image";
}

export function resolveAdminLiquorImageBucket() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
    process.env.SUPABASE_STORAGE_BUCKET ??
    DEFAULT_ADMIN_IMAGE_BUCKET
  );
}

export function validateAdminLiquorImageFile(file: AdminLiquorImageUploadFile) {
  const extension = ADMIN_IMAGE_EXTENSION_BY_TYPE[file.type];

  if (!extension) {
    throw new Error("jpg, png, webp, avif, gif 이미지만 업로드할 수 있습니다.");
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("이미지 파일이 비어 있습니다.");
  }

  if (file.size > MAX_ADMIN_IMAGE_BYTES) {
    throw new Error("이미지는 6MB 이하만 업로드할 수 있습니다.");
  }

  return {
    contentType: file.type,
    extension,
  };
}

export function buildAdminLiquorImageStoragePath(params: {
  liquorId: number;
  fileName: string;
  contentType: string;
  timestamp?: number;
}) {
  const liquorId = normalizeLiquorId(params.liquorId);
  const extension = ADMIN_IMAGE_EXTENSION_BY_TYPE[params.contentType];

  if (!extension) {
    throw new Error("지원하지 않는 이미지 형식입니다.");
  }

  const timestamp = Number.isFinite(params.timestamp) ? params.timestamp : Date.now();
  const safeFileName = sanitizeStorageFileName(params.fileName);
  return `admin-liquor-images/${liquorId}/${timestamp}-${safeFileName}.${extension}`;
}

export function buildAdminLiquorInfoUpdatePatch(input: AdminLiquorInfoUpdateInput) {
  return {
    product_name: normalizeRequiredString(input.product_name, "상품명"),
    normalized_name: normalizeRequiredString(input.normalized_name, "정규화 이름"),
    brand: normalizeOptionalString(input.brand),
    category: normalizeOptionalString(input.category),
    "class": normalizeOptionalString(input.clazz),
    country: normalizeOptionalString(input.country),
    volume_ml: normalizeOptionalNumber(input.volume_ml, "용량", 10000),
    alcohol_percent: normalizeOptionalNumber(input.alcohol_percent, "도수", 100),
    image_url: normalizeImageUrl(input.image_url),
  };
}

export async function fetchAdminLiquorInfoPageFromServerWithClient(
  supabase: AdminLiquorInfoSupabaseClient,
  params: FetchAdminLiquorInfoPageParams,
): Promise<AdminLiquorInfoPage> {
  const page = clampPage(params.page);
  const size = clampSize(params.size);
  const from = page * size;
  const to = from + size;
  const keyword = params.keyword?.trim() ?? "";

  let query = (supabase.from("liquor") as AdminLiquorInfoListQuery<AdminLiquorInfoRow>)
    .select(ADMIN_LIQUOR_SELECT)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (keyword) {
    query = query.or(buildAdminLiquorSearchFilter(keyword));
  }

  const { data, error, status } = await query;

  if (status === 416) {
    return {
      items: [],
      page,
      size,
      hasNext: false,
    };
  }

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AdminLiquorInfoRow[];
  const items = rows.slice(0, size).map(mapAdminLiquorInfoRow);

  return {
    items,
    page,
    size,
    hasNext: rows.length > size,
  };
}

export async function fetchAdminLiquorInfoPageFromServer(params: FetchAdminLiquorInfoPageParams) {
  return fetchAdminLiquorInfoPageFromServerWithClient(
    getSupabaseClient() as unknown as AdminLiquorInfoSupabaseClient,
    params,
  );
}

export async function updateAdminLiquorInfoFromServerWithClient(
  supabase: AdminLiquorInfoSupabaseClient,
  id: number,
  input: AdminLiquorInfoUpdateInput,
): Promise<AdminLiquorInfoItem> {
  const liquorId = normalizeLiquorId(id);

  const patch = buildAdminLiquorInfoUpdatePatch(input);
  const mutation = supabase.from("liquor") as AdminLiquorInfoMutationQuery<AdminLiquorInfoRow>;
  const { data, error } = await mutation
    .update(patch)
    .eq("id", liquorId)
    .select(ADMIN_LIQUOR_SELECT)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("수정된 주류 정보를 찾을 수 없습니다.");
  }

  return mapAdminLiquorInfoRow(data);
}

export async function updateAdminLiquorInfoFromServer(id: number, input: AdminLiquorInfoUpdateInput) {
  return updateAdminLiquorInfoFromServerWithClient(
    getSupabaseClient() as unknown as AdminLiquorInfoSupabaseClient,
    id,
    input,
  );
}

export async function updateAdminLiquorImageUrlFromServerWithClient(
  supabase: AdminLiquorInfoSupabaseClient,
  id: number,
  imageUrl: string,
) {
  const liquorId = normalizeLiquorId(id);
  const normalizedImageUrl = normalizeImageUrl(imageUrl);

  if (!normalizedImageUrl) {
    throw new Error("이미지 URL은 필수입니다.");
  }

  const mutation = supabase.from("liquor") as AdminLiquorInfoMutationQuery<AdminLiquorInfoRow>;
  const { data, error } = await mutation
    .update({ image_url: normalizedImageUrl })
    .eq("id", liquorId)
    .select(ADMIN_LIQUOR_SELECT)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("수정된 주류 정보를 찾을 수 없습니다.");
  }

  return mapAdminLiquorInfoRow(data);
}

export async function uploadAdminLiquorImageFromServerWithClient(
  supabase: AdminLiquorImageStorageClient,
  id: number,
  file: AdminLiquorImageUploadFile,
) {
  const liquorId = normalizeLiquorId(id);
  const { contentType } = validateAdminLiquorImageFile(file);
  const path = buildAdminLiquorImageStoragePath({
    liquorId,
    fileName: file.name,
    contentType,
  });
  const bucket = resolveAdminLiquorImageBucket();
  const storage = supabase.storage.from(bucket);
  const { error: uploadError } = await storage.upload(path, await file.arrayBuffer(), {
    cacheControl: "31536000",
    contentType,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = storage.getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("업로드된 이미지 공개 URL을 만들지 못했습니다.");
  }

  return updateAdminLiquorImageUrlFromServerWithClient(supabase, liquorId, data.publicUrl);
}

export async function uploadAdminLiquorImageFromServer(id: number, file: AdminLiquorImageUploadFile) {
  return uploadAdminLiquorImageFromServerWithClient(
    getSupabaseClient() as unknown as AdminLiquorImageStorageClient,
    id,
    file,
  );
}
