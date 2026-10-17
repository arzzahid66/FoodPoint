import { notFound } from "next/navigation";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { getSettings } from "@/server/services/settings";
import { formatPKR } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { PrintOnLoad } from "@/components/admin/print-button";

export const dynamic = "force-dynamic";

/** Narrow kitchen/receipt ticket that opens the print dialog automatically. */
export default async function PrintOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  await requireUser();
  const { orderId } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { id: orderId }, include: { items: true, table: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto w-[300px] bg-white p-4 font-mono text-sm text-black">
      <PrintOnLoad />
      <p className="text-center text-lg font-bold">{settings.shopName}</p>
      <p className="text-center">Order #{order.orderNumber}</p>
      <p className="text-center text-2xl font-bold">TABLE {order.table.label}</p>
      <p className="text-center text-xs">{formatDateTime(order.createdAt)}</p>
      <hr className="my-2 border-dashed border-black" />
      {order.items.map((item) => (
        <div key={item.id} className="flex justify-between gap-2">
          <span>
            {item.quantity} x {item.productName}
            {item.variantName !== "Regular" ? ` (${item.variantName})` : ""}
          </span>
          <span>{formatPKR(item.lineTotal)}</span>
        </div>
      ))}
      {order.note && (
        <>
          <hr className="my-2 border-dashed border-black" />
          <p className="font-bold">NOTE: {order.note}</p>
        </>
      )}
      <hr className="my-2 border-dashed border-black" />
      {order.tax > 0 && (
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatPKR(order.tax)}</span>
        </div>
      )}
      <div className="flex justify-between text-base font-bold">
        <span>TOTAL</span>
        <span>{formatPKR(order.total)}</span>
      </div>
      <p className="mt-3 text-center text-xs">Thank you!</p>
    </div>
  );
}
