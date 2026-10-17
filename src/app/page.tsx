import { cookies } from "next/headers";
import { ShopShell } from "@/components/shop/shop-shell";
import { MenuView } from "@/components/shop/menu-view";
import { EmptyState } from "@/components/ui/card";
import { getActiveTableByCode, getPublicMenu } from "@/server/services/menu";
import { getSettings } from "@/server/services/settings";
import { TABLE_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

// The menu lives here (outside the (shop) group) because it is the site root.
export default async function MenuPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const [{ table: tableParam }, menu, settings, cookieStore] = await Promise.all([
    searchParams,
    getPublicMenu(),
    getSettings(),
    cookies(),
  ]);
  const table = await getActiveTableByCode(cookieStore.get(TABLE_COOKIE)?.value);

  const categories = menu.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    products: c.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imagePublicId: p.imagePublicId,
      variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    })),
  }));

  return (
    <ShopShell>
      {tableParam === "invalid" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          This QR code is not active. Please ask our staff for help.
        </p>
      )}
      {!table && tableParam !== "invalid" && settings.isOpen && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          Scan the QR code on your table to place an order. You can browse the menu now.
        </p>
      )}
      {categories.length === 0 ? (
        <EmptyState title="Our menu is coming soon">Please check back shortly.</EmptyState>
      ) : (
        <MenuView categories={categories} canOrder={settings.isOpen} />
      )}
    </ShopShell>
  );
}
