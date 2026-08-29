// F-06 購入手続き（US-05）
// 根拠: docs/02-prototype/ui-spec.md §4、docs/03-design/screen-flow.md §5-5
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isSafeRecommendPath } from "@/lib/criteria";
import { getProductDetail } from "@/server/services/product-service";
import { PurchaseForm } from "./_components/purchase-form";

export const metadata: Metadata = { title: "購入手続き | プロテインえらび" };

export default async function PurchasePage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { productId } = await params;
  const query = await searchParams;
  const shopId = typeof query.shop === "string" ? query.shop : null;
  const fromRaw = typeof query.from === "string" ? query.from : null;
  // RV-02・RV-12: 自サイトの診断結果パスだけを引き回す
  const from = isSafeRecommendPath(fromRaw) ? fromRaw : null;

  const product = await getProductDetail(productId);
  const offer = product?.onlineShops.find((s) => s.shopId === shopId) ?? null;

  const backToDetail = `/products/${productId}${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  // RV-07: ショップの指定が商品と整合しないときは、先頭ショップに読み替えず明確に拒否する
  if (!product || !offer) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">購入手続き</h1>
        <Alert variant="inverted">
          <AlertTriangle aria-hidden />
          <AlertDescription>
            {product
              ? "指定された販売ショップではこの商品を購入できません。商品詳細から選び直してください。"
              : "指定された商品が見つかりません。"}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={product ? backToDetail : "/products"}>
            <ArrowLeft aria-hidden className="size-4" />
            {product ? "商品詳細に戻る" : "商品一覧に戻る"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* RV-12: from を維持したまま商品詳細に戻る */}
      <Link
        href={backToDetail}
        className="inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:no-underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        商品詳細に戻る
      </Link>

      <h1 className="text-2xl font-bold">購入手続き</h1>

      <PurchaseForm
        productId={product.id}
        productName={product.name}
        productFlavor={product.flavor}
        productBrand={product.brand}
        imageUrl={product.imageUrl}
        shopId={offer.shopId}
        shopName={offer.name}
        itemPrice={offer.itemPrice}
        shippingFee={offer.shippingFee}
        from={from}
      />
    </div>
  );
}
