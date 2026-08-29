export type Order = {
  id: string;
  orderedAt: string;
  productId: string;
  productName: string;
  brand: string;
  flavor: string;
  emoji: string;
  colors: [string, string];
  shopName: string;
  unitPrice: number;
  quantity: number;
  paymentMethod: string;
  contactEmail: string;
  contactPhone: string;
};

export type AddOrderInput = Omit<Order, "id" | "orderedAt">;

const orders: Order[] = [];

export function addOrder(input: AddOrderInput): Order {
  const order: Order = {
    ...input,
    id: `ORD-${String(orders.length + 1).padStart(4, "0")}`,
    orderedAt: new Date().toISOString(),
  };
  orders.unshift(order);
  return order;
}

export function listOrders(): Order[] {
  return [...orders];
}
