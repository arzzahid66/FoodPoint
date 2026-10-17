import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Field, Input, Label } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { requireUser } from "@/server/guard";
import { getSettings } from "@/server/services/settings";
import { updateSettings } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser("OWNER");
  const s = await getSettings();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <ActionForm action={updateSettings} className="space-y-6">
        <Card className="space-y-4 p-5">
          <Field label="Shop name" htmlFor="shopName">
            <Input id="shopName" name="shopName" defaultValue={s.shopName} required maxLength={60} />
          </Field>
          <div>
            <Label>Logo</Label>
            <ImageUpload name="logoPublicId" defaultValue={s.logoPublicId} />
          </div>
        </Card>
        <Card className="space-y-4 p-5">
          <div>
            <Checkbox name="isOpen" label="Accepting orders (shop is open)" defaultChecked={s.isOpen} />
            <p className="mt-1 text-xs text-zinc-500">Untick to stop new orders. Customers can still see the menu.</p>
          </div>
          <Field label="Opening hours (shown when closed)" htmlFor="openingHours">
            <Input id="openingHours" name="openingHours" defaultValue={s.openingHours ?? ""} placeholder="e.g. 12 pm – 2 am daily" maxLength={200} />
          </Field>
          <Field label="Tax %" htmlFor="taxPercent" hint="Added on top of the menu prices. Use 0 if prices already include tax.">
            <Input id="taxPercent" name="taxPercent" type="number" min={0} max={50} defaultValue={s.taxPercent} className="w-28" />
          </Field>
        </Card>
        <SubmitButton>Save settings</SubmitButton>
      </ActionForm>
    </div>
  );
}
