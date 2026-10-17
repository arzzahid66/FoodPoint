import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getSettings } from "@/server/services/settings";
import { getActiveTableByCode } from "@/server/services/menu";
import { calculateTotals } from "@/lib/order-math";
import { canTransition } from "@/lib/order-status";
import { randomCode } from "@/lib/utils";
import { startOfTodayPK } from "@/lib/time";
import type { PlaceOrderInput } from "@/lib/validators/order";

/** Errors whose message is safe to show to the customer. */
export class OrderError extends Error {}

const MAX_ORDERS_PER_TABLE_PER_MINUTE = 3;

export async function placeOrder(tableCode: string | undefined, input: PlaceOrderInput) {
  const settings = await getSettings();
  if (!settings.isOpen) throw new OrderError("Sorry, we are not taking orders right now.");

  const table = await getActiveTableByCode(tableCode);
  if (!table) throw new OrderError("Please scan the QR code on your table to place an order.");

  const recent = await db.order.count({
    where: { tableId: table.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= MAX_ORDERS_PER_TABLE_PER_MINUTE) {
    throw new OrderError("Too many orders from this table. Please wait a minute and try again.");
  }

  // Merge duplicate lines, then load real prices from the DB (never trust the client).
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  }
  const variants = await db.productVariant.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      active: true,
      product: { active: true, category: { active: true } },
    },
    include: { product: { select: { name: true } } },
  });
  if (variants.length !== quantities.size) {
    throw new OrderError("Some items in your cart are no longer available. Please review your cart.");
  }

  const lines = variants.map((v) => {
    const quantity = quantities.get(v.id)!;
    return {
      variantId: v.id,
      productName: v.product.name,
      variantName: v.name,
      unitPrice: v.price,
      quantity,
      lineTotal: v.price * quantity,
    };
  });
  const totals = calculateTotals(lines, settings.taxPercent);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.order.create({
        data: {
          orderNumber: randomCode(6),
          tableId: table.id,
          note: input.note || null,
          ...totals,
          items: { create: lines },
        },
        select: { orderNumber: true },
      });
    } catch (e) {
      // Retry only on an order number collision.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("Could not generate a unique order number");
}

export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { items: true, table: { select: { label: true } } },
  });
}

export async function updateOrderStatus(orderId: string, to: OrderStatus) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) throw new OrderError("Order not found");
  if (!canTransition(order.status, to)) {
    throw new OrderError(`Cannot change an order from ${order.status} to ${to}`);
  }
  // Conditional update guards against two staff members clicking at the same time.
  const result = await db.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { status: to, paidAt: to === "PAID" ? new Date() : undefined },
  });
  if (result.count === 0) throw new OrderError("This order was just updated by someone else. Refresh and try again.");
}

export async function listOrders(filter: "active" | "today") {
  const where: Prisma.OrderWhereInput =
    filter === "active"
      ? { status: { in: ["PENDING", "ACCEPTED", "PREPARING", "SERVED"] } }
      : { createdAt: { gte: startOfTodayPK() }, status: { in: ["PAID", "CANCELLED"] } };
  return db.order.findMany({
    where,
    orderBy: { createdAt: filter === "active" ? "asc" : "desc" },
    include: { items: true, table: { select: { label: true } } },
    take: 200,
  });
}

export type AdminOrder = Awaited<ReturnType<typeof listOrders>>[number];

export async function getPendingSummary() {
  const [count, latest] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.order.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, select: { id: true } }),
  ]);
  return { pending: count, latestPendingId: latest?.id ?? null };
}

export async function getTodayStats() {
  const since = startOfTodayPK();
  const [orders, paid, pending, active] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: since }, status: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { createdAt: { gte: since }, status: "PAID" }, _sum: { total: true } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: { in: ["ACCEPTED", "PREPARING", "SERVED"] } } }),
  ]);
  return { orders, revenue: paid._sum.total ?? 0, pending, active };
}
