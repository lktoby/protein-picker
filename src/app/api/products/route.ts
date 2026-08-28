// GET /api/products — 商品一覧・検索（F-03, F-04 / api-spec.md §2）
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { listProducts } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    return NextResponse.json(await listProducts(q));
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "商品の取得に失敗しました。");
  }
}
