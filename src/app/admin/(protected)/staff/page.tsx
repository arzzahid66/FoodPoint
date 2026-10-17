import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { createStaff, resetPassword, toggleStaff } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireUser("OWNER");
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return (
    <div className="max-w-4xl">
      <PageHeader title="Staff" description="Staff can view and update orders only. Owners can manage everything." />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-bold text-zinc-900">Add a login</h2>
        <ActionForm action={createStaff} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" name="name" required maxLength={60} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field label="Password" htmlFor="password" hint="At least 8 characters">
            <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          </Field>
          <Field label="Role" htmlFor="role">
            <Select id="role" name="role" defaultValue="STAFF">
              <option value="STAFF">Staff (orders only)</option>
              <option value="OWNER">Owner (full access)</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Create login</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card className="divide-y divide-zinc-100">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-48 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-zinc-900">{u.name}</p>
                <Badge tone={u.role === "OWNER" ? "brand" : "zinc"}>{u.role === "OWNER" ? "Owner" : "Staff"}</Badge>
                {!u.active && <Badge tone="red">Disabled</Badge>}
                {u.id === me.id && <span className="text-xs text-zinc-400">(you)</span>}
              </div>
              <p className="text-sm text-zinc-500">{u.email}</p>
            </div>
            <ActionForm action={resetPassword.bind(null, u.id)} resetOnSuccess className="flex items-center gap-2">
              <Input
                name="password"
                type="password"
                placeholder="New password"
                aria-label={`New password for ${u.name}`}
                minLength={8}
                required
                autoComplete="new-password"
                className="h-8 w-36"
              />
              <SubmitButton variant="outline" size="sm">
                Reset
              </SubmitButton>
            </ActionForm>
            {u.id !== me.id && (
              <ActionForm action={toggleStaff.bind(null, u.id, !u.active)}>
                <SubmitButton variant={u.active ? "ghost" : "outline"} size="sm" pendingText="...">
                  {u.active ? "Disable" : "Enable"}
                </SubmitButton>
              </ActionForm>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
