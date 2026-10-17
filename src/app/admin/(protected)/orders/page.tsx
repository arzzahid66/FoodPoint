import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderCard } from "@/components/admin/order-card";
import { listOrders } from "@/server/services/orders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "today" ? "today" : "active";
  const orders = await listOrders(view);

  return (
    <div>
      <AutoRefresh seconds={view === "active" ? 8 : 30} />
      <PageHeader
        title="Orders"
        description={view === "active" ? "Live orders. This page refreshes automatically." : "Paid and cancelled orders from today."}
      />
      <div className="mb-5 flex gap-2">
        {[
          { key: "active", label: "Active" },
          { key: "today", label: "Completed today" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "active" ? "/admin/orders" : "/admin/orders?view=today"}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              view === tab.key ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState title={view === "active" ? "No active orders" : "No completed orders today"}>
          {view === "active" && "New orders from tables will appear here with a sound."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
