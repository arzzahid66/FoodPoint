import { z } from "zod";
import { checkbox, optionalText } from "./common";

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const staffSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["OWNER", "STAFF"]),
});

export const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const tableSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(20),
});

export const settingsSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required").max(60),
  logoPublicId: optionalText(255),
  isOpen: checkbox,
  taxPercent: z.coerce.number().int().min(0).max(50),
  openingHours: optionalText(200),
});
