"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { OrderError, placeOrder } from "@/server/services/orders";
import { placeOrderSchema, type PlaceOrderInput } from "@/lib/validators/order";
import { TABLE_COOKIE } from "@/lib/constants";

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<{ orderNumber: string; error?: never } | { error: string; orderNumber?: never }> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Your cart looks invalid. Please review it and try again." };
  try {
    const tableCode = (await cookies()).get(TABLE_COOKIE)?.value;
    const order = await placeOrder(tableCode, parsed.data);
    revalidatePath("/admin", "layout");
    return { orderNumber: order.orderNumber };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error(e);
    return { error: "Could not place your order. Please try again or ask our staff." };
  }
}
