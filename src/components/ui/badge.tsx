import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
 * モノクロ配色なので、種類の違いは色相ではなく「面の濃さ」で表す
 * （ui-spec.md §11-3）。outline → muted → solid の順に強くなる。
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        outline: "border border-border text-foreground",
        muted: "bg-muted text-foreground",
        solid: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
