// ============================================================
// F-03 商品検索
// 根拠: docs/02-prototype/ui-spec.md §3（部分一致）、docs/03-design/api-spec.md §2
//
// 絞り込み（種類・価格帯など）は実装しない。要件のスコープ外 #5。
// ============================================================
import { PROTEIN_TYPE_LABELS, type Product } from "./types";

/** 商品名・フレーバーの昇順で並べる。要件に並び替え機能はないため、順序の安定だけを保証する */
function sortByName(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "ja");
    return byName !== 0 ? byName : a.flavor.localeCompare(b.flavor, "ja");
  });
}

/** 検索対象の文字列。商品名・ブランド・フレーバー・種類ラベルを対象にする */
function searchableText(product: Product): string {
  return [product.name, product.brand, product.flavor, PROTEIN_TYPE_LABELS[product.type]]
    .join(" ")
    .toLowerCase();
}

/**
 * 商品を部分一致で検索する。大文字小文字は区別しない。
 * 検索語が空（空白のみを含む）の場合は全件を返す。
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  const matched = q === "" ? products : products.filter((p) => searchableText(p).includes(q));
  return sortByName(matched);
}
