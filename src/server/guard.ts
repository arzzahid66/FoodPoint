import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Loads the signed-in admin user from the DB on every call, so deactivated
 * users and role changes take effect immediately (not when the JWT expires).
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return user?.active ? user : null;
}

/** For pages and layouts: redirects when not allowed. */
export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (role === "OWNER" && user.role !== "OWNER") redirect("/admin/orders");
  return user;
}

export class AuthError extends Error {}

/** For Server Actions and API routes: throws instead of redirecting. */
export async function assertUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not signed in");
  if (role === "OWNER" && user.role !== "OWNER") throw new AuthError("Only the owner can do this");
  return user;
}
