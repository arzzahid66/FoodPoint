import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CartView } from "@/components/shop/cart-view";
import { getActiveTableByCode } from "@/server/services/menu";
import { getSettings } from "@/server/services/settings";
import { TABLE_COOKIE } from "@/lib/constants";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const [settings, cookieStore] = await Promise.all([getSettings(), cookies()]);
  const table = await getActiveTableByCode(cookieStore.get(TABLE_COOKIE)?.value);
  return <CartView tableLabel={table?.label ?? null} isOpen={settings.isOpen} taxPercent={settings.taxPercent} />;
}
