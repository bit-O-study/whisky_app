import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../src/lib/supabase";

// Minimal typed surface mirroring catalog-server.ts (the shared client lacks generated types).
interface ManualPriceSupabase {
  from(table: "liquor" | "liquor_price" | "liquor_price_history" | "liquor_url"): {
    select(columns: string): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          limit(count: number): Promise<{ data: { id: number }[] | null; error: { message?: string } | null }>;
        };
        limit(count: number): Promise<{ data: { id: number }[] | null; error: { message?: string } | null }>;
      };
    };
    insert(values: Record<string, unknown>): Promise<{
      data: { id: number }[] | null;
      error: { message?: string; code?: string } | null;
      select?: () => unknown;
    }> & { select(columns: string): Promise<{ data: { id: number }[] | null; error: { message?: string; code?: string } | null }> };
    update(values: Record<string, unknown>): {
      eq(column: string, value: unknown): Promise<{ error: { message?: string } | null }>;
    };
  };
}

interface NewLiquorInput {
  name?: string;
  brand?: string;
  category?: string;
  volumeMl?: number;
  alcoholPercent?: number;
  country?: string;
  imageUrl?: string;
}

interface ManualPriceBody {
  liquorId?: number;
  newLiquor?: NewLiquorInput;
  source?: string;
  currentPrice?: number;
  originalPrice?: number | null;
  productUrl?: string | null;
}

interface SupabaseError {
  message?: string;
  code?: string;
}

interface RowWithId {
  id: number;
}

const DEFAULT_SOURCES = ["EMART_TRADERS", "EMART", "COSTCO", "LOTTEON", "HOMEPLUS"];

export async function GET() {
  return NextResponse.json({ sources: DEFAULT_SOURCES });
}

export async function POST(request: NextRequest) {
  let body: ManualPriceBody;
  try {
    body = (await request.json()) as ManualPriceBody;
  } catch {
    return NextResponse.json({ message: "잘못된 요청 본문" }, { status: 400 });
  }

  const source = (body.source ?? "").trim().toUpperCase();
  const currentPrice = Number(body.currentPrice);
  const originalPrice =
    body.originalPrice == null || body.originalPrice === undefined
      ? currentPrice
      : Number(body.originalPrice);
  const productUrl = body.productUrl?.trim() || null;

  if (!source) {
    return NextResponse.json({ message: "source는 필수입니다." }, { status: 400 });
  }
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return NextResponse.json({ message: "currentPrice는 양의 정수여야 합니다." }, { status: 400 });
  }
  if (!Number.isFinite(originalPrice) || originalPrice < currentPrice) {
    return NextResponse.json(
      { message: "originalPrice는 currentPrice 이상이어야 합니다." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseClient() as unknown as ManualPriceSupabase;

  // Resolve liquorId: either accept the one given, or insert a new liquor row first.
  let liquorId = Number(body.liquorId);
  let liquorAction: "reuse" | "insert" = "reuse";

  if (!Number.isFinite(liquorId) || liquorId <= 0) {
    if (!body.newLiquor || !body.newLiquor.name?.trim()) {
      return NextResponse.json(
        { message: "liquorId 또는 newLiquor.name 중 하나는 필수입니다." },
        { status: 400 },
      );
    }
    const insertResult = await insertNewLiquor(supabase, body.newLiquor, productUrl);
    if ("error" in insertResult) {
      return NextResponse.json(insertResult.error, { status: insertResult.status });
    }
    liquorId = insertResult.id;
    liquorAction = "insert";
  }

  const crawledAt = new Date().toISOString();
  const priceRow = {
    liquor_id: liquorId,
    source,
    current_price: currentPrice,
    original_price: originalPrice,
    crawled_at: crawledAt,
  };

  // upsert into liquor_price by (liquor_id, source)
  const { data: existingPrices, error: fetchError } = await supabase
    .from("liquor_price")
    .select("id")
    .eq("liquor_id", liquorId)
    .eq("source", source)
    .limit(1);

  if (fetchError) {
    return NextResponse.json(
      { message: "가격 조회 실패", detail: (fetchError as SupabaseError).message },
      { status: 500 },
    );
  }

  const existing = (existingPrices ?? []) as RowWithId[];
  if (existing.length > 0) {
    const { error: updateError } = await supabase
      .from("liquor_price")
      .update({
        current_price: currentPrice,
        original_price: originalPrice,
        crawled_at: crawledAt,
      })
      .eq("id", existing[0].id);

    if (updateError) {
      return NextResponse.json(
        { message: "가격 업데이트 실패", detail: (updateError as SupabaseError).message },
        { status: 500 },
      );
    }
  } else {
    const { error: insertError } = await supabase.from("liquor_price").insert(priceRow);
    if (insertError) {
      return NextResponse.json(
        { message: "가격 저장 실패", detail: (insertError as SupabaseError).message },
        { status: 500 },
      );
    }
  }

  // history is append-only so chart and card never disagree
  const { error: historyError } = await supabase.from("liquor_price_history").insert(priceRow);
  if (historyError) {
    return NextResponse.json(
      { message: "이력 저장 실패", detail: (historyError as SupabaseError).message },
      { status: 500 },
    );
  }

  if (productUrl) {
    const { data: existingUrls, error: urlFetchError } = await supabase
      .from("liquor_url")
      .select("id")
      .eq("liquor_id", liquorId)
      .eq("source", source)
      .limit(1);

    if (urlFetchError) {
      return NextResponse.json(
        { message: "URL 조회 실패", detail: (urlFetchError as SupabaseError).message },
        { status: 500 },
      );
    }

    const existingUrlRows = (existingUrls ?? []) as RowWithId[];
    if (existingUrlRows.length > 0) {
      const { error: urlUpdateError } = await supabase
        .from("liquor_url")
        .update({ product_url: productUrl })
        .eq("id", existingUrlRows[0].id);
      if (urlUpdateError) {
        return NextResponse.json(
          { message: "URL 업데이트 실패", detail: (urlUpdateError as SupabaseError).message },
          { status: 500 },
        );
      }
    } else {
      const { error: urlInsertError } = await supabase
        .from("liquor_url")
        .insert({ liquor_id: liquorId, source, product_url: productUrl });
      if (urlInsertError) {
        return NextResponse.json(
          { message: "URL 저장 실패", detail: (urlInsertError as SupabaseError).message },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    liquorId,
    liquorAction,
    source,
    currentPrice,
    originalPrice,
    crawledAt,
  });
}

function buildNormalizedName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\[.*?\]/g, " ")
    .replace(/\d+\s*(ml|mL|ML|l|L|리터)/g, " ")
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function insertNewLiquor(
  supabase: ManualPriceSupabase,
  input: NewLiquorInput,
  productUrl: string | null,
): Promise<{ id: number } | { error: { message: string; detail?: string }; status: number }> {
  const name = input.name?.trim() ?? "";
  if (!name) {
    return { error: { message: "newLiquor.name은 필수입니다." }, status: 400 };
  }

  const normalizedName = buildNormalizedName(name);
  if (!normalizedName) {
    return { error: { message: "name에서 유효한 글자를 추출할 수 없습니다." }, status: 400 };
  }

  // Build payload omitting optional fields when not provided so the DB defaults
  // (volume_ml=0, class='') and the unique key (normalized_name, class, volume_ml) behave correctly.
  const insertPayload: Record<string, unknown> = {
    normalized_name: normalizedName,
    product_name: name,
  };
  const brand = input.brand?.trim();
  if (brand) insertPayload.brand = brand;
  const category = input.category?.trim();
  if (category) insertPayload.category = category;
  const country = input.country?.trim();
  if (country) insertPayload.country = country;
  const imageUrl = input.imageUrl?.trim();
  if (imageUrl) insertPayload.image_url = imageUrl;
  if (productUrl) insertPayload.product_url = productUrl;
  if (Number.isFinite(input.volumeMl) && (input.volumeMl as number) > 0) {
    insertPayload.volume_ml = Number(input.volumeMl);
  }
  if (Number.isFinite(input.alcoholPercent) && (input.alcoholPercent as number) >= 0) {
    insertPayload.alcohol_percent = Number(input.alcoholPercent);
  }

  const { data, error } = await supabase.from("liquor").insert(insertPayload).select("id");
  if (error) {
    const msg = error.message ?? "";
    // unique index uq_liquor_identity = (normalized_name, class, volume_ml).
    // Surface a helpful hint so the operator searches the existing row instead of force-creating a duplicate.
    if (error.code === "23505" || /duplicate key|unique constraint/i.test(msg)) {
      return {
        error: {
          message: "이미 카탈로그에 존재하는 주류로 보입니다. 검색해서 선택해 주세요.",
          detail: msg,
        },
        status: 409,
      };
    }
    return { error: { message: "주류 저장 실패", detail: msg }, status: 500 };
  }

  const inserted = (data ?? []) as RowWithId[];
  if (inserted.length === 0 || !Number.isFinite(inserted[0].id)) {
    return { error: { message: "주류 저장 후 id를 받지 못했습니다." }, status: 500 };
  }
  return { id: inserted[0].id };
}
