// GET /api/recommendations — おすすめ（F-01, F-02 / api-spec.md §4）
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { parseCriteria } from "@/lib/criteria";
import { getRecommendations } from "@/server/services/recommendation-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = parseCriteria(request.nextUrl.searchParams);

    // RV-15: 不正な条件は黙って無視せず 400 を返す（画面側が通知に使う）
    if (parsed.status === "invalid") {
      return apiError("VALIDATION_ERROR", "診断条件の指定が正しくありません。");
    }
    if (parsed.status === "empty") {
      return apiError("VALIDATION_ERROR", "目的とタイミングを指定してください。", [
        { field: "purpose", message: "必須です。" },
        { field: "timing", message: "必須です。" },
      ]);
    }

    return NextResponse.json(await getRecommendations(parsed.criteria));
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "おすすめの取得に失敗しました。");
  }
}
