import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import { requireUser } from "@/server/guard";
import { getTodayStats } from "@/server/services/orders";
import { getSettings } from "@/server/services/settings";
import { formatPKR } from "@/lib/money";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("OWNER");
  const [stats, settings] = await Promise.all([getTodayStats(), getSettings()]);

  const cards = [
    { label: "Orders today", value: String(stats.orders) },
    { label: "Revenue today (paid)", value: formatPKR(stats.revenue) },
    { label: "Waiting to accept", value: String(stats.pending), highlight: stats.pending > 0 },
    { label: "In progress", value: String(stats.active) },
  ];

  return (
    <div>
      <AutoRefresh seconds={30} />
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description={settings.isOpen ? "Your shop is open and accepting orders." : "Your shop is closed. Customers cannot order."}
        actions={
          <Link href="/admin/orders" className={buttonVariants()}>
            Open live orders
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className={c.highlight ? "border-red-300 bg-red-50 p-5" : "p-5"}>
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-zinc-900">{c.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/products/new", title: "Add a product", text: "New burger, pizza or deal with photo and prices." },
          { href: "/admin/tables", title: "Print table QR codes", text: "Customers scan them to order." },
          { href: "/admin/settings", title: settings.isOpen ? "Close the shop" : "Open the shop", text: "Turn ordering on or off." },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full p-5 transition hover:border-brand">
              <p className="font-bold text-zinc-900">{l.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{l.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
