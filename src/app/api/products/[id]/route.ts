// GET /api/products/{id} — 商品詳細（F-04, F-05 / api-spec.md §3）
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { getProductDetail } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Next.js 15 以降、params は Promise なので await する（api-spec.md §1-5）
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return apiError("VALIDATION_ERROR", "商品の指定が正しくありません。");
    }
    const detail = await getProductDetail(id);
    if (!detail) {
      return apiError("NOT_FOUND", "指定された商品が見つかりません。");
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "商品の取得に失敗しました。");
  }
}
