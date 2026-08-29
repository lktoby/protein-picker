// ============================================================
// 注文の表示用変換と、リポジトリを繋いだ依存の実体
// 根拠: docs/03-design/api-spec.md §5・§6
// ============================================================
import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type DeliveryStatus,
  type PaymentMethod,
} from "@/server/domain/types";
import {
  findAllOrders,
  findOrderById,
  findOrderByIdempotencyKey,
  insertOrder,
  updateDeliveryStatus,
  type OrderWithContact,
} from "@/server/repositories/orders";
import { findProductById, findShopOffer } from "@/server/repositories/products";
import type { OrderServiceDeps } from "./order-service";

/** 注文サービスに渡す依存の実体（テストではこれを差し替える） */
export const orderServiceDeps: OrderServiceDeps = {
  findOrderByIdempotencyKey,
  findProductBasics: async (productId) => {
    const product = await findProductById(productId);
    return product
      ? { id: product.id, name: product.name, flavor: product.flavor, imageUrl: product.imageUrl }
      : null;
  },
  findShopOffer,
  insertOrder,
  findOrderById,
  updateDeliveryStatus,
};

export type OrderView = {
  id: string;
  orderNumber: string;
  orderedAt: string;
  deliveryStatus: DeliveryStatus;
  deliveryStatusLabel: string;
  productId: string;
  productName: string;
  productFlavor: string;
  imageUrl: string;
  shopName: string;
  unitItemPrice: number;
  shippingFee: number;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  contact: { email: string; phone: string };
};

export function toOrderView(order: OrderWithContact): OrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderedAt:
      order.orderedAt instanceof Date ? order.orderedAt.toISOString() : String(order.orderedAt),
    deliveryStatus: order.deliveryStatus,
    deliveryStatusLabel: DELIVERY_STATUS_LABELS[order.deliveryStatus],
    productId: order.productId,
    productName: order.productNameSnapshot,
    productFlavor: order.productFlavorSnapshot,
    imageUrl: order.productImageUrlSnapshot,
    shopName: order.shopNameSnapshot,
    unitItemPrice: order.unitItemPrice,
    shippingFee: order.shippingFee,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[order.paymentMethod],
    contact: { email: order.contactEmail, phone: order.contactPhone },
  };
}

/** 注文履歴。新しい順。利用者で絞り込まない（要件 Q-09） */
export async function listOrderViews(): Promise<OrderView[]> {
  const orders = await findAllOrders();
  return orders.map(toOrderView);
}

export async function getOrderView(id: string): Promise<OrderView | null> {
  const order = await findOrderById(id);
  return order ? toOrderView(order) : null;
}
