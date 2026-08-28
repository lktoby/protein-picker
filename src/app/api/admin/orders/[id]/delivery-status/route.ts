// PATCH /api/admin/orders/{id}/delivery-status — お届け状況の更新（F-10 / api-spec.md §7）
//
// これは管理用。UI からは呼ばない（ui-spec.md §5「利用者が自分で状態を進める画面は作らない」）。
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { changeDeliveryStatus } from "@/server/services/order-service";
import { orderServiceDeps, toOrderView } from "@/server/services/order-view";
import type { DeliveryStatus } from "@/server/domain/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = process.env.ADMIN_API_TOKEN;
  // トークン未設定のまま無防備に公開されるのを防ぐ（api-spec.md §1-3）
  if (!token) {
    return apiError("SERVICE_UNAVAILABLE", "この操作は現在利用できません。");
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return apiError("UNAUTHORIZED", "この操作を行う権限がありません。");
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { deliveryStatus?: string };
    const result = await changeDeliveryStatus(
      id,
      body.deliveryStatus as DeliveryStatus,
      orderServiceDeps,
    );

    switch (result.status) {
      case "updated":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json(toOrderView(result.order as any));
      case "invalid":
        return apiError("VALIDATION_ERROR", result.message);
      case "not_found":
        return apiError("NOT_FOUND", result.message);
      case "conflict":
        return apiError("CONFLICT", result.message);
    }
  } catch (error) {
    console.error(error);
    return apiError("INTERNAL_ERROR", "お届け状況の更新に失敗しました。");
  }
}
