"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { FoodImage } from "@/components/food-image";
import { formatPKR } from "@/lib/money";
import { calculateTotals } from "@/lib/order-math";
import { placeOrderAction } from "@/server/actions/shop";
import { useCart } from "./cart-context";
import { QuantityStepper } from "./menu-view";
import { saveLastOrder } from "./last-order";

export function CartView({
  tableLabel,
  isOpen,
  taxPercent,
}: {
  tableLabel: string | null;
  isOpen: boolean;
  taxPercent: number;
}) {
  const { items, ready, setQuantity, clear } = useCart();
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [placed, setPlaced] = React.useState(false);

  if (!ready) return <p className="py-12 text-center text-zinc-500">Loading your cart...</p>;
  if (placed) return <p className="py-12 text-center font-semibold text-zinc-700">Order placed! Opening your order...</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-bold text-zinc-900">Your cart is empty</p>
        <p className="mt-1 text-sm text-zinc-500">Add something tasty from the menu.</p>
        <Link href="/" className={buttonVariants({ className: "mt-5" })}>
          Browse menu
        </Link>
      </div>
    );
  }

  const totals = calculateTotals(
    items.map((i) => ({ unitPrice: i.price, quantity: i.quantity })),
    taxPercent,
  );
  const blocker = !isOpen
    ? "We are closed right now and not taking orders."
    : !tableLabel
      ? "Please scan the QR code on your table to place your order."
      : null;

  function submit() {
    startTransition(async () => {
      const result = await placeOrderAction({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        note: note.trim() || undefined,
      });
      if (!result.orderNumber) {
        toast.error(result.error ?? "Could not place your order.");
        return;
      }
      saveLastOrder(result.orderNumber);
      setPlaced(true);
      clear();
      router.push(`/order/${result.orderNumber}`);
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-extrabold text-zinc-900">Your order</h1>
      <Card className="divide-y divide-zinc-100">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-3 p-3">
            <FoodImage publicId={item.imagePublicId} alt={item.productName} size={120} className="h-14 w-14 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-900">{item.productName}</p>
              <p className="text-xs text-zinc-500">
                {item.variantName} · {formatPKR(item.price)}
              </p>
            </div>
            <QuantityStepper value={item.quantity} min={0} onChange={(n) => setQuantity(item.variantId, n)} />
          </div>
        ))}
      </Card>

      <label htmlFor="note" className="mb-1.5 mt-5 block text-sm font-semibold text-zinc-800">
        Note for the kitchen (optional)
      </label>
      <Textarea
        id="note"
        maxLength={300}
        placeholder="e.g. no onions, extra spicy"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <Card className="mt-5 space-y-1.5 p-4 text-sm">
        <Row label="Subtotal" value={formatPKR(totals.subtotal)} />
        {taxPercent > 0 && <Row label={`Tax (${taxPercent}%)`} value={formatPKR(totals.tax)} />}
        <div className="border-t border-zinc-100 pt-2">
          <Row label="Total" value={formatPKR(totals.total)} bold />
        </div>
        <p className="pt-1 text-xs text-zinc-500">Pay at the counter (cash). {tableLabel && `Serving to table ${tableLabel}.`}</p>
      </Card>

      {blocker && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{blocker}</p>}

      <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={pending || !!blocker}>
        {pending ? "Placing order..." : `Place order · ${formatPKR(totals.total)}`}
      </Button>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold text-zinc-900" : "text-zinc-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
