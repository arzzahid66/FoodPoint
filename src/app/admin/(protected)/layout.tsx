import { AdminNav } from "@/components/admin/admin-nav";
import { requireUser } from "@/server/guard";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);
  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav role={user.role} name={user.name} shopName={settings.shopName} />
      <main className="mx-auto max-w-6xl p-4 md:ml-60 md:p-8">{children}</main>
    </div>
  );
}
