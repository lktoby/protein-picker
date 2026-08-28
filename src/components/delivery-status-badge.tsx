import { ClipboardList, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DELIVERY_STATUS_LABELS, type DeliveryStatus } from "@/server/domain/types";

/**
 * お届け状況のバッジ（F-10 / RV-17）。
 *
 * ui-spec.md §11-3: モノクロ配色なので色相では区別せず、
 * **塗りの強さ**（枠線のみ → 淡い面 → 反転）で 3 段階を表す。
 * アイコンとラベルを常に併記するため、色覚特性のある利用者でも区別できる。
 */
const STATUS_STYLE: Record<
  DeliveryStatus,
  { variant: "outline" | "muted" | "solid"; Icon: typeof Truck }
> = {
  ordered: { variant: "outline", Icon: ClipboardList },
  shipping: { variant: "muted", Icon: Truck },
  delivered: { variant: "solid", Icon: PackageCheck },
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { variant, Icon } = STATUS_STYLE[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon aria-hidden className="size-3.5" />
      {DELIVERY_STATUS_LABELS[status]}
    </Badge>
  );
}
