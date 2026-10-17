"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { formatPKR } from "@/lib/money";
import { useCart } from "./cart-context";
import { useLastOrder } from "./last-order";

export function CartButton() {
  const { count } = useCart();
  const lastOrder = useLastOrder();
  return (
    <div className="flex items-center gap-2">
      {lastOrder && (
        <Link href={`/order/${lastOrder}`} className="text-sm font-semibold text-brand-dark hover:underline">
          My order
        </Link>
      )}
      <Link
        href="/cart"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
        aria-label={`Cart, ${count} items`}
      >
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}

/** Sticky bottom bar on the menu page once the cart has items. */
export function CartBar() {
  const { count, subtotal } = useCart();
  const pathname = usePathname();
  if (count === 0 || pathname === "/cart") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white p-3">
      <Link
        href="/cart"
        className="mx-auto flex h-12 max-w-md items-center justify-between rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark"
      >
        <span>
          View cart · {count} item{count === 1 ? "" : "s"}
        </span>
        <span>{formatPKR(subtotal)}</span>
      </Link>
    </div>
  );
}
