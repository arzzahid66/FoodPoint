import type { Metadata } from "next";
import QRCode from "qrcode";
import { Download, Trash2 } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { PrintButton } from "@/components/admin/print-button";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { createTable, deleteTable, toggleTable } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Tables & QR codes" };

export default async function TablesPage() {
  await requireUser("OWNER");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const tables = await db.diningTable.findMany({ orderBy: { createdAt: "asc" } });
  const withQr = await Promise.all(
    tables.map(async (t) => {
      const url = `${siteUrl}/t/${t.code}`;
      return { ...t, url, qr: await QRCode.toDataURL(url, { width: 512, margin: 2 }) };
    }),
  );

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Tables & QR codes"
          description="Print a QR code for each table. Customers scan it to order for that table."
          actions={tables.length > 0 && <PrintButton label="Print all QR codes" />}
        />
        {siteUrl.includes("localhost") && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            QR codes point to <strong>{siteUrl}</strong>. Set NEXT_PUBLIC_SITE_URL to your real domain before printing.
          </p>
        )}
        <Card className="mb-6 p-5">
          <ActionForm action={createTable} resetOnSuccess className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <Field label="New table" htmlFor="label" hint="Short name printed on the QR, e.g. T1, 12, Family-1">
                <Input id="label" name="label" placeholder={`T${tables.length + 1}`} required maxLength={20} />
              </Field>
            </div>
            <SubmitButton className="mb-5">Add table</SubmitButton>
          </ActionForm>
        </Card>
      </div>

      {withQr.length === 0 ? (
        <EmptyState title="No tables yet">Add your first table above.</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 print:grid-cols-3">
          {withQr.map((t) => (
            <Card key={t.id} className="flex flex-col items-center p-4 text-center print:break-inside-avoid print:border-black print:shadow-none">
              <p className="text-xl font-extrabold text-zinc-900">Table {t.label}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR code */}
              <img src={t.qr} alt={`QR code for table ${t.label}`} className="my-2 w-full max-w-48" />
              <p className="text-xs text-zinc-500 print:text-black">Scan to see the menu & order</p>
              <div className="mt-3 flex w-full flex-col gap-2 print:hidden">
                {!t.active && <Badge tone="red" className="self-center">Disabled</Badge>}
                <a
                  href={t.qr}
                  download={`table-${t.label}-qr.png`}
                  className="flex items-center justify-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
                >
                  <Download className="h-4 w-4" /> Download PNG
                </a>
                <div className="flex justify-center gap-1">
                  <ActionForm action={toggleTable.bind(null, t.id, !t.active)}>
                    <SubmitButton variant="outline" size="sm" pendingText="...">
                      {t.active ? "Disable" : "Enable"}
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={deleteTable.bind(null, t.id)}>
                    <ConfirmSubmit
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete table ${t.label}`}
                      title={`Delete table ${t.label}?`}
                      message="Its printed QR code will stop working."
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </ConfirmSubmit>
                  </ActionForm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
