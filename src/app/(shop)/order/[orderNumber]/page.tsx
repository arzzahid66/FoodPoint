import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import { getOrderByNumber } from "@/server/services/orders";
import { formatPKR } from "@/lib/money";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order status" };

const STEPS = [
  { status: "PENDING", label: "Order received" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "SERVED", label: "Served" },
  { status: "PAID", label: "Paid" },
] as const;

export default async function OrderStatusPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber.toUpperCase());
  if (!order) notFound();

  const cancelled = order.status === "CANCELLED";
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);
  const finished = cancelled || order.status === "PAID";

  return (
    <div className="mx-auto max-w-xl">
      {!finished && <AutoRefresh seconds={5} />}
      <div className="mb-5 text-center">
        <p className="text-sm text-zinc-500">Order number</p>
        <p className="text-4xl font-extrabold tracking-widest text-zinc-900">{order.orderNumber}</p>
        <p className="mt-1 text-sm text-zinc-500">
          Table {order.table.label} · placed at {formatTime(order.createdAt)}
        </p>
      </div>

      {cancelled ? (
        <Card className="border-red-200 bg-red-50 p-4 text-center font-semibold text-red-700">
          This order was cancelled. Please speak to our staff.
        </Card>
      ) : (
        <Card className="p-4">
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <li key={step.status} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                      done ? "border-brand bg-brand text-white" : "border-zinc-300 text-transparent",
                      i === currentIndex && !finished && "animate-pulse",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <span className={cn("font-medium", done ? "text-zinc-900" : "text-zinc-400")}>{step.label}</span>
                </li>
              );
            })}
          </ol>
          {!finished && <p className="mt-4 text-xs text-zinc-500">This page updates automatically.</p>}
        </Card>
      )}

      <Card className="mt-4 divide-y divide-zinc-100 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 p-3">
            <span>
              <span className="font-semibold">{item.quantity}×</span> {item.productName}
              {item.variantName !== "Regular" && <span className="text-zinc-500"> ({item.variantName})</span>}
            </span>
            <span className="shrink-0">{formatPKR(item.lineTotal)}</span>
          </div>
        ))}
        {order.tax > 0 && (
          <div className="flex justify-between p-3 text-zinc-600">
            <span>Tax</span>
            <span>{formatPKR(order.tax)}</span>
          </div>
        )}
        <div className="flex justify-between p-3 text-base font-bold">
          <span>Total</span>
          <span>{formatPKR(order.total)}</span>
        </div>
      </Card>
      {order.status !== "PAID" && !cancelled && (
        <p className="mt-3 text-center text-sm text-zinc-600">Please pay at the counter when you are done.</p>
      )}

      <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-6 w-full" })}>
        Back to menu
      </Link>
    </div>
  );
}
