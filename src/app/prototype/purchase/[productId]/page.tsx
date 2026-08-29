import { PRODUCTS } from "../../_mock/products";
import PurchaseFormClient from "./purchase-form-client";

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ shop?: string | string[]; from?: string | string[] }>;
};

function firstQueryParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ productId: product.id }));
}

export default async function PurchasePage({ params, searchParams }: PageProps) {
  const { productId } = await params;
  const query = await searchParams;

  return (
    <PurchaseFormClient
      productId={productId}
      shopId={firstQueryParam(query.shop)}
      from={firstQueryParam(query.from)}
    />
  );
}
