import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { UtensilsCrossed } from "lucide-react";
import { getSettings } from "@/server/services/settings";
import { getActiveTableByCode } from "@/server/services/menu";
import { imageUrl } from "@/lib/cloudinary";
import { TABLE_COOKIE } from "@/lib/constants";
import { CartProvider } from "./cart-context";
import { CartBar, CartButton } from "./cart-button";

/** Header + cart provider shared by all customer pages. */
export async function ShopShell({ children }: { children: React.ReactNode }) {
  const [settings, cookieStore] = await Promise.all([getSettings(), cookies()]);
  const table = await getActiveTableByCode(cookieStore.get(TABLE_COOKIE)?.value);
  const logo = imageUrl(settings.logoPublicId, 96);

  return (
    <CartProvider>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            {logo ? (
              <Image src={logo} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
            )}
            <span className="truncate text-lg font-extrabold text-zinc-900">{settings.shopName}</span>
          </Link>
          {table && (
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-dark">
              Table {table.label}
            </span>
          )}
          <div className="ml-auto">
            <CartButton />
          </div>
        </div>
      </header>
      {!settings.isOpen && (
        <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
          We are closed right now and not taking orders.
          {settings.openingHours ? ` Opening hours: ${settings.openingHours}` : ""}
        </div>
      )}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4">{children}</main>
      <CartBar />
    </CartProvider>
  );
}
