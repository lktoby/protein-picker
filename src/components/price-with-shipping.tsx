import { cn } from "@/lib/utils";
import { formatYen } from "@/server/domain/pricing";
import type { ShippingNote } from "@/server/domain/pricing";

/**
 * 価格と送料の注記をまとめて表示する（ui-spec.md §6 / RV-16・RV-18①）。
 *
 * ui-spec.md §6 は「『送料込み』で終わらせず、必ず送料の金額を明記する」を
 * 価格を表示するすべての箇所に適用する共通ルールとしている。
 * その表示規則をこの部品 1 つに閉じ込め、画面ごとの書き忘れを防ぐ。
 */
export function PriceWithShipping({
  price,
  shippingNote,
  suffix,
  sourceName,
  size = "default",
  className,
}: {
  price: number;
  shippingNote: ShippingNote;
  /** 一覧カードの「〜」など、金額の直後に付ける文字 */
  suffix?: string;
  /** 最安値を出している販売元。おすすめカードで「最安値: ショップ名」を出す（RV-18①） */
  sourceName?: string;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            "font-bold tabular-nums",
            size === "lg" ? "text-2xl" : "text-lg",
          )}
        >
          {formatYen(price)}
          {suffix}
        </span>
        {/* 送料無料は情報として目立たせたいので太字にする（モノクロなので色は変えない・§11-3） */}
        <span
          className={cn(
            "text-xs",
            shippingNote.kind === "free"
              ? "font-bold text-foreground"
              : "text-muted-foreground",
          )}
        >
          （{shippingNote.label}）
        </span>
      </p>
      {sourceName ? (
        <p className="text-xs text-muted-foreground">最安値: {sourceName}</p>
      ) : null}
    </div>
  );
}
