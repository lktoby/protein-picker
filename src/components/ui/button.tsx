import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
 * ui-spec.md §1: タップ領域は「見た目のサイズに関わらず 44px」を確保する。
 * 見た目の高さが 44px 未満のサイズ（default/sm）には、擬似要素で
 * 44px の当たり判定だけを広げる（見た目は変えない）。
 */
const HIT_AREA_44 =
  "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

const buttonVariants = cva(
  // フォーカスリングは全バリアント共通で必須（キーボードで現在位置が見えること）。
  // カーソルは pointer にしない。
  "relative inline-flex shrink-0 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-card text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline underline-offset-4",
      },
      size: {
        default: cn("h-10 px-4 py-2", HIT_AREA_44),
        sm: cn("h-9 px-3", HIT_AREA_44),
        lg: "h-12 px-8 text-base",
        icon: "size-11",
      },
    },
    compoundVariants: [
      {
        // link は文章の中に置く想定。透明な当たり判定が周囲の文字を覆うため広げない
        // （WCAG 2.5.8 の inline 例外に相当）。
        variant: "link",
        class: "after:hidden",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
