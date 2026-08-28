"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { PriceWithShipping } from "@/components/price-with-shipping";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { RecommendationItem } from "@/server/services/recommendation-service";

/**
 * おすすめのカルーセル（ui-spec.md §2）。
 * 1 件ずつ表示し、移動手段は「左右矢印ボタン」「ドット」「スワイプ」「左右矢印キー」の 4 つ（RV-06, RV-15）。
 */
export function RecommendationCarousel({
  items,
  backUrl,
}: {
  items: RecommendationItem[];
  backUrl: string;
}) {
  return (
    <Carousel opts={{ align: "start" }} aria-label="おすすめ商品">
      <div className="flex items-center gap-2 sm:gap-4">
        <CarouselPrevious aria-label="前のおすすめを見る" />
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.product.id}>
              <RecommendationCard item={item} backUrl={backUrl} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext aria-label="次のおすすめを見る" />
      </div>
      <Dots count={items.length} />
    </Carousel>
  );
}

/** ドットインジケーター。見た目は小さいがタップ領域は 44px を確保する（RV-06, RV-14） */
function Dots({ count }: { count: number }) {
  const { selectedIndex, scrollTo } = useCarousel();
  return (
    <div className="flex justify-center">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`${index + 1}位を表示`}
          aria-current={index === selectedIndex ? "true" : undefined}
          onClick={() => scrollTo(index)}
          className="p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <span
            className={cn(
              "block size-3 rounded-full",
              index === selectedIndex ? "bg-foreground" : "bg-border",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** カードの構成は ui-spec.md §2 の順序どおり（RV-09, RV-18①） */
function RecommendationCard({
  item,
  backUrl,
}: {
  item: RecommendationItem;
  backUrl: string;
}) {
  const { product } = item;
  return (
    <Card className="overflow-hidden">
      <div className="relative flex justify-center border-b border-border bg-muted">
        <Badge variant="solid" className="absolute left-3 top-3">
          おすすめ {item.rank} 位
        </Badge>
        <Image
          src={product.imageUrl}
          alt={`${product.name} ${product.flavor}`}
          width={240}
          height={240}
          className="h-44 w-auto object-contain"
        />
      </div>
      <CardContent className="space-y-3 p-5">
        <div>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <p className="text-lg font-bold leading-snug">
            {product.name}{" "}
            <span className="text-sm font-normal text-muted-foreground">{product.flavor}</span>
          </p>
        </div>

        {/* 価格・1gあたり・含有率 → 送料の内訳・最安値のショップ名（§6 / RV-18①） */}
        <div className="space-y-1">
          <PriceWithShipping
            price={product.lowestPrice}
            shippingNote={product.shippingNote}
            sourceName={item.cheapestShopName}
          />
          <p className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>1gあたり 約{product.pricePerGram.toFixed(1)}円</span>
            <span>タンパク質 {product.proteinContent}%</span>
          </p>
        </div>

        {/* ✓ 一致した条件のチップ（RV-09） */}
        {item.matches.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {item.matches.map((match) => (
              <li key={match}>
                <Badge variant="muted" className="gap-1">
                  <Check aria-hidden className="size-3" />
                  {match}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {/* 1 行のおすすめ理由（RV-09） */}
        <p className="rounded-card bg-muted px-3 py-2 text-sm">{item.reason}</p>

        <Button asChild size="lg" className="w-full">
          <Link href={`/products/${product.id}?from=${encodeURIComponent(backUrl)}`}>
            詳細・購入方法を見る
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
