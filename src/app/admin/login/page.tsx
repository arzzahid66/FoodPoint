import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getCurrentUser } from "@/server/guard";
import { login } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Admin login" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-zinc-900">Admin login</h1>
          <p className="text-sm text-zinc-500">Sign in to manage your shop</p>
        </div>
        <ActionForm action={login} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton className="w-full" pendingText="Signing in...">
            Sign in
          </SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
