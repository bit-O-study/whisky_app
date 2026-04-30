import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../src/lib/supabase";

// The shared Supabase client lacks generated types so its query builder is `never`.
// Mirror catalog-server.ts: cast to a minimal typed surface for the tables we touch.
interface ManualPriceSupabase {
  from(table: "liquor_price" | "liquor_price_history" | "liquor_url"): {
    select(columns: string): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          limit(count: number): Promise<{ data: { id: number }[] | null; error: { message?: string } | null }>;
        };
      };
    };
    insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>;
    update(values: Record<string, unknown>): {
      eq(column: string, value: unknown): Promise<{ error: { message?: string } | null }>;
    };
  };
}

interface ManualPriceBody {
  liquorId?: number;
  source?: string;
  currentPrice?: number;
  originalPrice?: number | null;
  productUrl?: string | null;
}

interface SupabaseError {
  message?: string;
  code?: string;
}

interface PriceRow {
  id: number;
}

const DEFAULT_SOURCES = ["EMART_TRADERS", "EMART", "COSTCO", "LOTTEON", "HOMEPLUS"];

export async function GET() {
  // exposed so the form can populate the source dropdown without hardcoding the list twice
  return NextResponse.json({ sources: DEFAULT_SOURCES });
}

export async function POST(request: NextRequest) {
  let body: ManualPriceBody;
  try {
    body = (await request.json()) as ManualPriceBody;
  } catch {
    return NextResponse.json({ message: "잘못된 요청 본문" }, { status: 400 });
  }

  const liquorId = Number(body.liquorId);
  const source = (body.source ?? "").trim().toUpperCase();
  const currentPrice = Number(body.currentPrice);
  const originalPrice =
    body.originalPrice == null || body.originalPrice === undefined
      ? currentPrice
      : Number(body.originalPrice);
  const productUrl = body.productUrl?.trim() || null;

  if (!Number.isFinite(liquorId) || liquorId <= 0) {
    return NextResponse.json({ message: "liquorId가 유효하지 않습니다." }, { status: 400 });
  }
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
  const crawledAt = new Date().toISOString();

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

  const priceRow = {
    liquor_id: liquorId,
    source,
    current_price: currentPrice,
    original_price: originalPrice,
    crawled_at: crawledAt,
  };

  const existing = (existingPrices ?? []) as PriceRow[];
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

    const existingUrlRows = (existingUrls ?? []) as PriceRow[];
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
    source,
    currentPrice,
    originalPrice,
    crawledAt,
  });
}
