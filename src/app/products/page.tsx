// ============================================================
// 商品検索・一覧 `/products`（F-03）
// 根拠: docs/03-design/screen-flow.md §5-3、docs/02-prototype/ui-spec.md §3・§6
// - サーバーコンポーネントからサービス層を直接呼ぶ（screen-flow.md §6）
// - 絞り込み UI は作らない（要件スコープ外 #5）
// ============================================================
import { Search } from "lucide-react";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts } from "@/server/services/product-service";

// DB を参照するため静的プリレンダリングしない（ビルド時に DB が無いため）
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "商品をさがす | プロテインえらび",
  description: "商品名・ブランド名でプロテインを検索し、送料込みの価格と1gあたり価格で比べられます。",
};

export default async function ProductsPage({
  searchParams,
}: {
  // Next.js 15 以降 searchParams は Promise なので await する（screen-flow.md §6）
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const { items, total } = await listProducts(query);

  return (
    // 外枠（main・最大幅・余白）は layout.tsx が持つ
    <div>
      <h1 className="text-2xl font-bold">商品をさがす</h1>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        商品名・ブランド名・味・種類で検索できます。
        表示価格はすべて送料込みで、内訳は商品詳細で確認できます。
      </p>

      {/* GET フォームなので送信すると URL の ?q= が更新され、ページが再描画される */}
      <form action="/products" method="get" className="mt-6 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="q" className="mb-1 block text-sm font-bold">
            商品名・ブランド名で検索
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="例: ホエイ / 筋トレ堂 / チョコレート"
          />
        </div>
        <Button type="submit" className="h-11">
          <Search aria-hidden="true" />
          検索する
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <span className="font-bold tabular-nums text-foreground">{total} 件</span>
        {query ? `（「${query}」で検索）` : null}
      </p>

      {total === 0 ? (
        <Alert className="mt-4">
          <AlertDescription>
            {query
              ? // ui-spec.md §3: 0 件時は検索語を引用して示す
                `「${query}」に一致する商品が見つかりませんでした。別のキーワードでお試しください。`
              : "表示できる商品がありません。"}
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
