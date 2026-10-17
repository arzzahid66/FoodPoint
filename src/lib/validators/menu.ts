import { z } from "zod";
import { checkbox, optionalText, sortOrder } from "./common";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  imagePublicId: optionalText(255),
  sortOrder,
  active: checkbox,
});

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Every size needs a name").max(40),
  price: z.coerce.number().int("Price must be a whole number").min(1, "Price must be at least Rs 1").max(1_000_000),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  categoryId: z.string().min(1, "Choose a category"),
  description: optionalText(500),
  imagePublicId: optionalText(255),
  sortOrder,
  active: checkbox,
  variants: z.preprocess(
    (v) => {
      try {
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        return [];
      }
    },
    z.array(variantSchema).min(1, "Add at least one size/price").max(10),
  ),
});

export type ProductInput = z.infer<typeof productSchema>;
