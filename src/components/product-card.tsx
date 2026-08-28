// ============================================================
// 一覧のカード（ProductCard）
// 根拠: docs/02-prototype/ui-spec.md §3・§6、docs/03-design/screen-flow.md §5-3
// 表示項目: 写真・種類バッジ・ブランド・商品名＋フレーバー・最安値〜（送料の注記つき）・
//           1gあたり価格・タンパク質含有率
// ============================================================
import Image from "next/image";
import Link from "next/link";
import { PriceWithShipping } from "@/components/price-with-shipping";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductSummary } from "@/server/services/product-service";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    // screen-flow.md §5-3: カード全体をクリックで商品詳細へ。from は付けない（戻り先は一覧）
    <Link
      href={`/products/${product.id}`}
      className="group block h-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full overflow-hidden transition-colors group-hover:bg-accent">
        {/* 幅・高さを固定してレイアウトシフトを防ぐ（screen-flow.md §1）。
            画面で唯一色を持つ要素なので、暗背景で浮かないよう下辺に枠線を敷く（§1-3） */}
        <Image
          src={product.imageUrl}
          alt={`${product.brand} ${product.name}`}
          width={400}
          height={400}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 33vw, 100vw"
          className="aspect-square w-full border-b border-border bg-muted object-cover"
        />
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product.typeLabel}</Badge>
            <span className="truncate text-xs text-muted-foreground">{product.brand}</span>
          </div>

          <h2 className="text-base font-bold leading-snug">
            {product.name}
            <span className="block text-sm font-medium text-muted-foreground">
              {product.flavor}
            </span>
          </h2>

          {/* 価格表示は必ずこの部品を通す（ui-spec.md §6 の共通ルール）。
              一覧は「最安値〜」の表記なので suffix に「〜」を渡す */}
          <PriceWithShipping
            price={product.lowestPrice}
            shippingNote={product.shippingNote}
            suffix="〜"
          />

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <dt>1gあたり</dt>
              <dd className="font-bold tabular-nums text-foreground">
                約{product.pricePerGram.toFixed(1)}円
              </dd>
            </div>
            <div className="flex gap-1">
              <dt>タンパク質</dt>
              <dd className="font-bold tabular-nums text-foreground">
                {product.proteinContent}%
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
