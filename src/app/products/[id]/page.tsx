// ============================================================
// 商品詳細 `/products/[id]`（F-04, F-05）
// 根拠: docs/03-design/screen-flow.md §5-4、docs/02-prototype/ui-spec.md §3・§6
// - 戻り導線は遷移元で切り替える（RV-02）。from は自サイトの /recommend のみ許可（オープンリダイレクト防止）
// - ネット通販は総額の安い順・最安に「最安」バッジ（RV-11）
// - 価格の下に必ず送料の内訳を出す（RV-16, RV-18①）
// ============================================================
import { Clock, Phone, Store, Train } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PriceWithShipping } from "@/components/price-with-shipping";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isSafeRecommendPath } from "@/lib/criteria";
import { formatYen } from "@/server/domain/pricing";
import { getProductDetail, type ProductDetail } from "@/server/services/product-service";

// DB を参照するため静的プリレンダリングしない（ビルド時に DB が無いため）
export const dynamic = "force-dynamic";

type PageProps = {
  // Next.js 15 以降 params / searchParams は Promise（screen-flow.md §6）
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetail(id);
  if (!product) {
    return { title: "商品が見つかりません | プロテインえらび" };
  }
  return {
    title: `${product.name}（${product.flavor}） | プロテインえらび`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const product = await getProductDetail(id);

  if (!product) {
    return (
      <div>
        <h1 className="text-2xl font-bold">商品が見つかりませんでした</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          お探しの商品は削除されたか、URL が間違っている可能性があります。
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">商品一覧へ戻る</Link>
        </Button>
      </div>
    );
  }

  // RV-02: 診断から来たときだけ診断結果に戻す。外部 URL は弾く
  const fromParam = typeof from === "string" ? from : undefined;
  const safeFrom = isSafeRecommendPath(fromParam) ? fromParam : undefined;

  return (
    // 外枠（main・最大幅・余白）は layout.tsx が持つ
    <div>
      {/* 1. 戻り導線（遷移元で切り替える・RV-02） */}
      <Button asChild variant="link" size="sm" className="px-0">
        <Link href={safeFrom ?? "/products"}>
          {safeFrom ? "← おすすめ結果に戻る" : "← 商品一覧に戻る"}
        </Link>
      </Button>

      {/* 2. 商品サマリー */}
      <div className="mt-4 grid gap-6 sm:grid-cols-[240px_1fr]">
        <Image
          src={product.imageUrl}
          alt={`${product.brand} ${product.name}`}
          width={480}
          height={480}
          sizes="(min-width: 640px) 240px, 100vw"
          priority
          className="aspect-square w-full rounded-card border border-border bg-muted object-cover"
        />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{product.brand}</p>
          <h1 className="text-2xl font-bold leading-snug">
            {product.name}
            <span className="block text-base font-medium text-muted-foreground">
              {product.flavor}
            </span>
          </h1>
          <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="solid">{product.typeLabel}</Badge>
            {product.preferenceLabels.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 3. スペック 4 点（ui-spec.md §3） */}
      <h2 className="mt-10 text-lg font-bold">スペック</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <dt className="text-xs text-muted-foreground">最安値（全チャネル・送料込み）</dt>
          <dd className="mt-1">
            {/* 価格表示は必ずこの部品を通す（ui-spec.md §6） */}
            <PriceWithShipping
              price={product.lowestPrice}
              shippingNote={product.shippingNote}
              sourceName={product.cheapestSourceName}
            />
          </dd>
        </Card>
        <Card className="p-4">
          <dt className="text-xs text-muted-foreground">1gあたり価格（送料込み）</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">
            約{product.pricePerGram.toFixed(1)}円
          </dd>
        </Card>
        <Card className="p-4">
          <dt className="text-xs text-muted-foreground">タンパク質含有率</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{product.proteinContent}%</dd>
        </Card>
        <Card className="p-4">
          <dt className="text-xs text-muted-foreground">内容量</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">
            {product.weightG.toLocaleString("ja-JP")}g
          </dd>
        </Card>
      </dl>

      <OnlineShops product={product} safeFrom={safeFrom} />
      <PhysicalStores product={product} />
    </div>
  );
}

/**
 * 4. ネット通販で買う。
 * `onlineShops` はサービス層で総額の安い順に並び、先頭に `isCheapest` が付いている（RV-11）。
 */
function OnlineShops({
  product,
  safeFrom,
}: {
  product: ProductDetail;
  safeFrom: string | undefined;
}) {
  const purchaseHref = (shopId: string) => {
    const query = new URLSearchParams({ shop: shopId });
    // RV-12: 診断経由の文脈（from）は購入フローまで引き回す
    if (safeFrom) query.set("from", safeFrom);
    return `/purchase/${product.id}?${query.toString()}`;
  };

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">ネット通販で買う</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        総額（送料込み）の安い順に並んでいます。
      </p>

      <ul className="mt-3 space-y-3">
        {product.onlineShops.map((shop) => (
          <li key={shop.shopId}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{shop.name}</span>
                    {/* RV-11: 最安のショップを明示する（比較の結論を目視スキャンに委ねない） */}
                    {shop.isCheapest ? <Badge variant="solid">最安</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    1gあたり{" "}
                    <span className="font-bold tabular-nums text-foreground">
                      約{shop.pricePerGram.toFixed(1)}円
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  {/*
                   * ui-spec.md §6 のショップ行の指定どおり「総額 → その下に内訳」の形にする。
                   * ここだけ PriceWithShipping を使わないのは、同じ送料を注記と内訳で
                   * 二重に書くことになるため。送料の金額は下の内訳で必ず明記している。
                   */}
                  <p className="text-lg font-bold tabular-nums">{formatYen(shop.totalPrice)}</p>
                  {shop.shippingFee === 0 ? (
                    // 送料無料は色ではなく「太字＋淡い面のチップ」で強調する（ui-spec.md §11-3）
                    <Badge variant="muted">{shop.breakdownLabel}</Badge>
                  ) : (
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {shop.breakdownLabel}
                    </p>
                  )}
                </div>

                <Button asChild>
                  <Link href={purchaseHref(shop.shopId)}>このショップで購入</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        表示価格はすべて送料込みで、各行に内訳（商品代金 + 送料）を記載しています。
        デモのため購入はモックで、実際の決済・注文は発生しません。
      </p>
    </section>
  );
}

/** 5. 実店舗で買う（F-05）。店頭渡しなので送料の概念がない（ui-spec.md §6） */
function PhysicalStores({ product }: { product: ProductDetail }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">実店舗で買う</h2>

      {product.stores.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          この商品を取り扱っている実店舗のデータはありません。
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {product.stores.map((store) => (
            <li key={store.storeId}>
              <Card className="h-full">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Store aria-hidden="true" className="size-4 shrink-0" />
                    <span className="font-bold">{store.name}</span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">店頭価格</p>
                    {/* 価格表示は必ずこの部品を通す（ui-spec.md §6） */}
                    <PriceWithShipping
                      price={store.price}
                      shippingNote={{ kind: "store", fee: 0, label: "店頭価格・送料なし" }}
                    />
                  </div>

                  <Separator />

                  <dl className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <dt>
                        <Train aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span className="sr-only">アクセス</span>
                      </dt>
                      <dd className="text-muted-foreground">{store.access}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt>
                        <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span className="sr-only">電話番号</span>
                      </dt>
                      <dd className="tabular-nums text-muted-foreground">{store.phone}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt>
                        <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span className="sr-only">営業時間</span>
                      </dt>
                      <dd className="text-muted-foreground">{store.businessHours}</dd>
                    </div>
                  </dl>

                  <p className="text-xs text-muted-foreground">
                    店頭でのお渡しのため送料はかかりません。
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
