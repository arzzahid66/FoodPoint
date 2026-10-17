import "server-only";
import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import type { ActionState } from "@/lib/action-state";
import { firstError } from "@/lib/validators/common";
import { AuthError } from "@/server/guard";
import { OrderError } from "@/server/services/orders";

/** Errors whose message is safe to show in the admin UI. */
export class UserError extends Error {}

/**
 * Runs an action body and turns known errors into a friendly { error } result.
 * Unknown errors are logged and replaced with a generic message.
 */
export async function safeAction(fn: () => Promise<string>): Promise<ActionState> {
  try {
    return { ok: await fn() };
  } catch (e) {
    unstable_rethrow(e); // let Next.js redirect()/notFound() through
    if (e instanceof AuthError || e instanceof UserError || e instanceof OrderError) return { error: e.message };
    if (e instanceof ZodError) return { error: firstError(e) };
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return { error: "That name or email is already in use." };
      if (e.code === "P2003") return { error: "This item is still in use, so it cannot be deleted." };
    }
    console.error(e);
    return { error: "Something went wrong. Please try again." };
  }
}
