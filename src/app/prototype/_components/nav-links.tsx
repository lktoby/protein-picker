"use client";

// ナビゲーション（現在地のアクティブ表示付き・RV-14）

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/prototype/recommend", label: "おすすめ診断" },
  { href: "/prototype/products", label: "商品をさがす" },
  { href: "/prototype/orders", label: "注文履歴" },
  { href: "/prototype/glossary", label: "用語説明" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
      {LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "py-2 text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "py-2 hover:text-emerald-700"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
