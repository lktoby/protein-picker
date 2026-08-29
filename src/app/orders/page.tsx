// F-07 注文履歴 / F-08 お問い合わせ先 / F-10 お届け状況（US-06, US-07, US-09）
// 根拠: docs/02-prototype/ui-spec.md §5、docs/03-design/screen-flow.md §5-7
import type { Metadata } from "next";
import Link from "next/link";
import { Info, Search, ShoppingBag, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listOrderViews } from "@/server/services/order-view";
import { OrderCard } from "./_components/order-card";

// DB を参照するため静的プリレンダリングしない（ビルド時に DB が無いため）
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "注文履歴 | プロテインえらび" };

export default async function OrdersPage() {
  // 利用者で絞り込まない（アカウントを作らないため。要件 Q-09）。新しい順
  const orders = await listOrderViews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">注文履歴</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          注文した商品と、お届け状況の一覧です。商品について困ったら「お問い合わせ」から販売店舗の連絡先を確認できます。
        </p>
      </div>

      <Alert variant="muted">
        <Info aria-hidden />
        <AlertDescription className="text-xs">
          このデモではアカウントを作らないため、注文履歴はこのアプリで注文したものすべてを表示します。
        </AlertDescription>
      </Alert>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-10 text-center">
            <ShoppingBag aria-hidden className="mx-auto size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              まだ注文がありません。まずは自分に合う一本を見つけましょう。
            </p>
            {/* RV-15: 第一 CTA は主導線の診断、第二 CTA が検索 */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/recommend">
                  <Target aria-hidden className="size-4" />
                  おすすめ診断で選ぶ
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products">
                  <Search aria-hidden className="size-4" />
                  商品をさがす
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
