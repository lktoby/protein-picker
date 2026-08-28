// F-06 購入完了 / F-10 お届け状況の初期表示
// 根拠: docs/02-prototype/ui-spec.md §4・§5、docs/03-design/screen-flow.md §5-6
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { DeliveryStatusBadge } from "@/components/delivery-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSafeRecommendPath } from "@/lib/criteria";
import { formatYen } from "@/server/domain/pricing";
import { getOrderView } from "@/server/services/order-view";

// DB を参照するため静的プリレンダリングしない（ビルド時に DB が無いため）
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ご注文完了 | プロテインえらび" };

export default async function OrderCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderId } = await params;
  const query = await searchParams;
  const fromRaw = typeof query.from === "string" ? query.from : null;
  const from = isSafeRecommendPath(fromRaw) ? fromRaw : null;

  const order = await getOrderView(orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
      <CheckCircle2 aria-hidden className="mx-auto size-14" />
      <h1 className="text-2xl font-bold">ご注文が完了しました（モック）</h1>

      <Card>
        <CardContent className="space-y-1 p-5 text-left text-sm">
          <p>
            <span className="text-muted-foreground">注文番号:</span>{" "}
            <b className="tabular-nums">{order.orderNumber}</b>
          </p>
          <p>
            <span className="text-muted-foreground">商品:</span> {order.productName}（
            {order.productFlavor}） × {order.quantity}
          </p>
          <p>
            <span className="text-muted-foreground">ショップ:</span> {order.shopName}
          </p>
          <p>
            <span className="text-muted-foreground">支払い方法:</span> {order.paymentMethodLabel}
            （ダミー）
          </p>
          <p>
            <span className="text-muted-foreground">合計:</span>{" "}
            <b className="tabular-nums">{formatYen(order.totalPrice)}</b>
            <span className="text-xs text-muted-foreground">
              （内 送料 {formatYen(order.shippingFee)}）
            </span>
          </p>
          {/* RV-17: 注文直後のお届け状況 */}
          <p className="flex items-center gap-2 pt-1">
            <span className="text-muted-foreground">お届け状況:</span>
            <DeliveryStatusBadge status={order.deliveryStatus} />
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        実際の決済・配送は行われません。注文はこのデモ内にのみ記録されています。
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/orders">注文履歴を見る</Link>
        </Button>
        {/* RV-12: 診断経由なら結果に戻れる */}
        {from ? (
          <Button asChild variant="outline">
            <Link href={from}>診断結果に戻る</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/products">買い物を続ける</Link>
        </Button>
      </div>
    </div>
  );
}
