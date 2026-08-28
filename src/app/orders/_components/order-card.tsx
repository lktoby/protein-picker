import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { DeliveryStatusBadge } from "@/components/delivery-status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { formatYen } from "@/server/domain/pricing";
import type { OrderView } from "@/server/services/order-view";

/**
 * 注文カード（ui-spec.md §5）。
 * - 商品名の上には**ブランドではなくお届け状況**を表示する（RV-17）
 * - 商品部分をクリックすると商品詳細へ遷移する（RV-10）
 * - お問い合わせ先はアコーディオンで開閉し、同時に開くのは 1 件のみ（F-08）
 */
export function OrderCard({ order }: { order: OrderView }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            注文番号 <b className="tabular-nums text-foreground">{order.orderNumber}</b>
          </span>
          <time dateTime={order.orderedAt}>
            {new Date(order.orderedAt).toLocaleString("ja-JP")}
          </time>
        </div>

        {/* RV-10: 商品部分全体が商品詳細へのリンク */}
        <Link
          href={`/products/${order.productId}`}
          className="-m-1 flex items-center gap-4 rounded-card p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={order.imageUrl}
            alt={`${order.productName} ${order.productFlavor}`}
            width={56}
            height={56}
            className="shrink-0 rounded-card border border-border bg-muted"
          />
          <div className="min-w-0 flex-1">
            {/* RV-17: ブランドの位置にお届け状況を出す */}
            <DeliveryStatusBadge status={order.deliveryStatus} />
            <p className="mt-1 font-bold">
              {order.productName}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {order.productFlavor}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {order.shopName}・
              <span className="tabular-nums">
                {formatYen(order.unitItemPrice)} × {order.quantity} ={" "}
                <b className="text-foreground">{formatYen(order.totalPrice)}</b>
              </span>
              （内 送料 {formatYen(order.shippingFee)}）・{order.paymentMethodLabel}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs underline underline-offset-4">
              商品詳細を見る
              <ArrowRight aria-hidden className="size-3" />
            </p>
          </div>
        </Link>

        {/* F-08: お問い合わせ先。type="single" collapsible なので同時に 1 件しか開かない */}
        <Accordion type="single" collapsible>
          <AccordionItem value="contact" className="border-b-0">
            <AccordionTrigger>お問い合わせ</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 rounded-card bg-muted p-4 text-sm">
                <p className="font-bold">
                  この商品のお問い合わせ先（販売ショップ: {order.shopName}）
                </p>
                <p className="flex items-center gap-2">
                  <Mail aria-hidden className="size-4" />
                  <span className="font-mono">{order.contact.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone aria-hidden className="size-4" />
                  <span className="font-mono">{order.contact.phone}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  デモのため表示のみです。実際のメール送信・発信は行いません。
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
