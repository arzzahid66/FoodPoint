import { z } from "zod";

/** HTML checkboxes send "on" when ticked and nothing when not. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const sortOrder = z.coerce.number().int().min(0).max(9999).default(0);

export function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
