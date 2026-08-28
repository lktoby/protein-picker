// ============================================================
// ホーム `/`
// 根拠: docs/03-design/screen-flow.md §5-1、docs/02-prototype/ui-spec.md §1
// 3 つの主導線（おすすめ診断・商品をさがす・注文履歴）への入口だけを持つ。
// ============================================================
import { Package, Search, Target } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 3 枚のカード導線。おすすめ診断は主導線なので強調する（screen-flow.md §5-1）。
 * モノクロ配色では色で強調できないため「濃い面に明るい文字（反転）」で表す（ui-spec.md §11-3）。
 */
const ENTRIES = [
  {
    href: "/recommend",
    icon: Target,
    title: "おすすめ診断",
    description: "目的・タイミング・こだわりを選ぶと、あなたに合うプロテインを順位と理由つきで紹介します。",
    emphasis: true,
  },
  {
    href: "/products",
    icon: Search,
    title: "商品をさがす",
    description: "商品名やブランド名で検索して、送料込みの価格・1gあたり価格・タンパク質含有率を並べて比べられます。",
    emphasis: false,
  },
  {
    href: "/orders",
    icon: Package,
    title: "注文履歴",
    description: "これまでの注文と、お届け状況（注文済み／お届け中／お届け済み）を確認できます。",
    emphasis: false,
  },
] as const;

export default function HomePage() {
  return (
    // 外枠（main・最大幅・余白）は layout.tsx が持つ
    <div>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        はじめてのプロテインを、
        <br className="sm:hidden" />
        迷わずえらぶ。
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        種類が多くて選べない人のためのアプリです。表示価格はすべて送料込みで、内容量が違う商品も
        1gあたり価格で公平に比べられます。
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="block h-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card
                  className={cn(
                    "h-full gap-3 p-6 transition-colors",
                    entry.emphasis
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-7"
                    strokeWidth={1.75}
                  />
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  <CardContent
                    className={cn(
                      "p-0 text-sm leading-relaxed",
                      entry.emphasis ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {entry.description}
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
