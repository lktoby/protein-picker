"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * ダークモードの切替（ui-spec.md §11-1）。
 * メニューバーのアイコンボタン 1 つでライト ⇄ ダークを切り替える。
 * 初期状態は OS 設定に従い（layout の defaultTheme="system"）、一度押すとその選択が記憶される。
 *
 * アイコンは JavaScript の状態ではなく CSS（dark: 修飾子）で切り替える。
 * サーバー側ではテーマが確定できないため、状態で分岐すると hydration がずれるうえ、
 * 初回描画でアイコンが一瞬入れ替わる。ラベルも両モードで同じ文言にしてずれを防ぐ。
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="表示モード（ライト・ダーク）を切り替える"
      title="表示モード（ライト・ダーク）を切り替える"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon aria-hidden className="size-5 dark:hidden" />
      <Sun aria-hidden className="hidden size-5 dark:block" />
    </Button>
  );
}
