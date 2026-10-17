import type { OrderStatus } from "@prisma/client";
import { Printer } from "lucide-react";
import { Badge, Card, type Tone } from "@/components/ui/card";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/ui/action-form";
import { setOrderStatus } from "@/server/actions/admin";
import type { AdminOrder } from "@/server/services/orders";
import { NEXT_STATUS, STATUS_LABEL } from "@/lib/order-status";
import { formatPKR } from "@/lib/money";
import { formatTime } from "@/lib/time";

const TONE: Record<OrderStatus, Tone> = {
  PENDING: "red",
  ACCEPTED: "amber",
  PREPARING: "blue",
  SERVED: "brand",
  PAID: "green",
  CANCELLED: "zinc",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Accept",
  ACCEPTED: "Start preparing",
  PREPARING: "Mark served",
  SERVED: "Mark paid",
};

export function OrderCard({ order }: { order: AdminOrder }) {
  const next = NEXT_STATUS[order.status];
  const isActive = !!next;
  return (
    <Card className={order.status === "PENDING" ? "border-red-300 ring-2 ring-red-100" : undefined}>
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 p-4">
        <div>
          <p className="text-lg font-extrabold tracking-wider text-zinc-900">#{order.orderNumber}</p>
          <p className="text-sm text-zinc-500">
            Table <span className="font-bold text-zinc-800">{order.table.label}</span> · {formatTime(order.createdAt)}
          </p>
        </div>
        <Badge tone={TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
      </div>
      <ul className="space-y-1 p-4 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              <span className="font-bold">{item.quantity}×</span> {item.productName}
              {item.variantName !== "Regular" && <span className="text-zinc-500"> ({item.variantName})</span>}
            </span>
            <span className="shrink-0 text-zinc-600">{formatPKR(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {order.note && (
        <p className="mx-4 mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">Note:</span> {order.note}
        </p>
      )}
      <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
        <span className="font-bold text-zinc-900">{formatPKR(order.total)}</span>
        <a
          href={`/admin/print/${order.id}`}
          target="_blank"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <Printer className="h-4 w-4" /> Print
        </a>
      </div>
      {isActive && (
        <div className="flex gap-2 px-4 pb-4">
          <ActionForm action={setOrderStatus.bind(null, order.id, next)} className="flex-1">
            <SubmitButton className="w-full" variant={next === "PAID" ? "success" : "default"} pendingText="Updating...">
              {NEXT_LABEL[order.status]}
            </SubmitButton>
          </ActionForm>
          <ActionForm action={setOrderStatus.bind(null, order.id, "CANCELLED")}>
            <ConfirmSubmit
              variant="outline"
              title="Cancel this order?"
              message={`Order #${order.orderNumber} for table ${order.table.label} will be cancelled.`}
              confirmLabel="Cancel order"
            >
              Cancel
            </ConfirmSubmit>
          </ActionForm>
        </div>
      )}
    </Card>
  );
}
