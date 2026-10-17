"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { AuthError as NextAuthError } from "next-auth";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import { assertUser } from "@/server/guard";
import { safeAction, UserError } from "@/server/actions/safe";
import { updateOrderStatus } from "@/server/services/orders";
import { loginSchema, passwordSchema, settingsSchema, staffSchema, tableSchema } from "@/lib/validators/admin";
import { firstError, formToObject } from "@/lib/validators/common";
import type { ActionState } from "@/lib/action-state";
import { randomCode } from "@/lib/utils";

// ── Auth ──────────────────────────────────────────────────────

export async function login(formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/admin" });
    return {};
  } catch (e) {
    if (e instanceof NextAuthError) return { error: "Wrong email or password." };
    throw e; // successful sign-in throws a redirect
  }
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}

// ── Orders (owner + staff) ────────────────────────────────────

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  return safeAction(async () => {
    await assertUser();
    await updateOrderStatus(orderId, status);
    revalidatePath("/admin", "layout");
    return status === "CANCELLED" ? "Order cancelled" : "Order updated";
  });
}

// ── Tables ────────────────────────────────────────────────────

export async function createTable(formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const { label } = tableSchema.parse(formToObject(formData));
    await db.diningTable.create({ data: { label, code: randomCode(10).toLowerCase() } });
    revalidatePath("/admin/tables");
    return `Table ${label} added`;
  });
}

export async function toggleTable(id: string, active: boolean) {
  return safeAction(async () => {
    await assertUser("OWNER");
    await db.diningTable.update({ where: { id }, data: { active } });
    revalidatePath("/admin/tables");
    return active ? "Table enabled" : "Table disabled";
  });
}

export async function deleteTable(id: string) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const orders = await db.order.count({ where: { tableId: id } });
    if (orders > 0) throw new UserError("This table has past orders. Disable it instead of deleting.");
    await db.diningTable.delete({ where: { id } });
    revalidatePath("/admin/tables");
    return "Table deleted";
  });
}

// ── Staff ─────────────────────────────────────────────────────

export async function createStaff(formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const { password, ...data } = staffSchema.parse(formToObject(formData));
    await db.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) } });
    revalidatePath("/admin/staff");
    return `${data.name} can now log in`;
  });
}

export async function toggleStaff(id: string, active: boolean) {
  return safeAction(async () => {
    const me = await assertUser("OWNER");
    if (id === me.id) throw new UserError("You cannot disable your own account.");
    await db.user.update({ where: { id }, data: { active } });
    revalidatePath("/admin/staff");
    return active ? "Account enabled" : "Account disabled";
  });
}

export async function resetPassword(id: string, formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const { password } = passwordSchema.parse(formToObject(formData));
    await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    return "Password updated";
  });
}

// ── Settings ──────────────────────────────────────────────────

export async function updateSettings(formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const data = settingsSchema.parse(formToObject(formData));
    const values = { ...data, logoPublicId: data.logoPublicId ?? null, openingHours: data.openingHours ?? null };
    await db.setting.upsert({ where: { id: 1 }, update: values, create: { id: 1, ...values } });
    revalidatePath("/", "layout");
    return "Settings saved";
  });
}
