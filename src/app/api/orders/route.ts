// GET /api/orders — 注文履歴（F-07, F-08, F-10 / api-spec.md §6）
// POST /api/orders — 注文の作成（F-06 / api-spec.md §5）
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { createOrder } from "@/server/services/order-service";
import { orderServiceDeps, toOrderView, listOrderViews } from "@/server/services/order-view";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listOrderViews();
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "注文履歴の取得に失敗しました。");
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストの形式が正しくありません。");
  }

  try {
    const result = await createOrder(body, orderServiceDeps);

    switch (result.status) {
      case "created":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json(toOrderView(result.order as any), { status: 201 });
      case "existing":
        // RV-07: 同じ冪等キーの再送は新規作成せず既存の注文を返す（201 ではなく 200）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json(toOrderView(result.order as any), { status: 200 });
      case "invalid":
        return apiError("VALIDATION_ERROR", "リクエストの内容が正しくありません。", result.errors);
      case "not_found":
        return apiError("NOT_FOUND", result.message);
      case "unprocessable":
        return apiError("UNPROCESSABLE", result.message);
    }
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "注文の作成に失敗しました。");
  }
}
