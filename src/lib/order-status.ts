import type { OrderStatus } from "@prisma/client";

export const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "SERVED"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  SERVED: "Served",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

/** The forward step for each status, used by the admin "next" button. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "SERVED",
  SERVED: "PAID",
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  if (to === "CANCELLED") return ACTIVE_STATUSES.includes(from);
  return NEXT_STATUS[from] === to;
}
