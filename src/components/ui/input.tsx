import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 枠線は border-border ではなく border-input を使う。
        // 入力欄の枠は 3:1 のコントラストが必要（ui-spec.md §11-3）。
        // 高さ h-11 = 44px はタップ領域の要件。
        "flex h-11 w-full min-w-0 rounded-card border border-input bg-card px-3 py-2 text-base outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "read-only:bg-muted read-only:text-muted-foreground",
        "file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
