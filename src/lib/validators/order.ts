import { z } from "zod";

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "Your cart is empty")
    .max(50),
  note: z.string().trim().max(300).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
