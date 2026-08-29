"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

/** ui-spec.md §1: ナビは 4 項目 */
const NAV_ITEMS = [
  { href: "/recommend", label: "おすすめ診断" },
  { href: "/products", label: "商品をさがす" },
  { href: "/orders", label: "注文履歴" },
  { href: "/glossary", label: "用語説明" },
] as const;

/**
 * 共通ヘッダー（ui-spec.md §1）。
 * - sticky
 * - 現在地のナビをアクティブ表示する（RV-14）
 * - タップ領域は 44px 目安（RV-14, RV-15）
 * - 右端にダークモードの切替アイコン（§11-1）
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2">
        <Link
          href="/"
          className="rounded-md py-2 text-lg font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          プロテインえらび
        </Link>

        <nav aria-label="メインメニュー" className="flex flex-wrap gap-x-5 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // py-2 で 44px 目安のタップ領域を確保する
                  "rounded-md py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "border-b-2 border-foreground font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
