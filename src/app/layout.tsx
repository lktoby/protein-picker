import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ui-spec.md §8: ひな形既定の Arial から変更する。日本語の可読性を最優先に選定（screen-flow.md §1）
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// ui-spec.md §1（RV-14）: ひな形の「Create Next App」のままにしない
export const metadata: Metadata = {
  title: "プロテインえらび",
  description:
    "目的・タイミング・こだわりから、あなたに合ったプロテインをおすすめ。送料込みの価格で比較できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ui-spec.md §1（RV-08①）: 日本語コンテンツなので lang="ja"
    // suppressHydrationWarning: テーマはサーバー側で確定できないため（screen-flow.md §1-3 手順4）
    <html lang="ja" suppressHydrationWarning className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/*
            ui-spec.md §1: モックである旨・個人情報を入力させない旨を常時表示する。
            モノクロ配色では反転が最も強い強調になるため inverted を使う（§11-3）。
          */}
          <Alert variant="inverted" className="rounded-none border-0 px-4 py-1.5 text-center">
            <AlertDescription className="justify-center text-xs sm:text-sm">
              これはモックデータで動くデモです。実在の商品・価格ではありません。個人情報は入力しないでください。
            </AlertDescription>
          </Alert>

          <SiteHeader />

          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

          <footer className="py-8 text-center text-xs text-muted-foreground">
            プロテインえらび — レビュー用デモ
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
