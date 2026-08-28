import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "./_components/nav-links";

export const metadata: Metadata = {
  title: "プロテイン比較・購入アプリ（デモ）",
  description: "モックデータで動くプロトタイプ",
};

export default function PrototypeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-amber-100 text-amber-900 text-center text-xs sm:text-sm px-4 py-1.5 border-b border-amber-200">
        🧪 これはモックデータで動くデモです。実在の商品・価格ではありません。個人情報は入力しないでください。
      </div>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/prototype" className="font-bold text-lg text-emerald-700">
            🥤 プロテインえらび
          </Link>
          <NavLinks />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-8">
        プロテインえらび — レビュー用デモ
      </footer>
    </div>
  );
}
