"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
 * type="single" / type="multiple" のどちらでも使えるように、
 * Radix の Root の型（判別ユニオン）をそのまま受け渡す。
 */
function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        // ピル型。min-h-11 = 44px はタップ領域の要件（ui-spec.md §1）。
        // モノクロなので選択状態は面の反転で示す。
        "inline-flex min-h-11 shrink-0 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-bold outline-none transition-colors",
        "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
