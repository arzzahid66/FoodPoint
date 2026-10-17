import { describe, expect, it } from "vitest";
import { productSchema } from "./menu";
import { placeOrderSchema } from "./order";
import { settingsSchema } from "./admin";

describe("productSchema", () => {
  const base = { name: "Zinger", categoryId: "c1", sortOrder: "0" };

  it("parses form data with JSON variants and checkbox", () => {
    const result = productSchema.parse({
      ...base,
      active: "on",
      description: "  ",
      variants: JSON.stringify([{ name: "Regular", price: 550 }]),
    });
    expect(result.active).toBe(true);
    expect(result.description).toBeUndefined();
    expect(result.variants).toEqual([{ name: "Regular", price: 550 }]);
  });

  it("treats a missing checkbox as false", () => {
    const result = productSchema.parse({ ...base, variants: '[{"name":"R","price":1}]' });
    expect(result.active).toBe(false);
  });

  it("rejects products without a valid price", () => {
    expect(productSchema.safeParse({ ...base, variants: "[]" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, variants: '[{"name":"R","price":0}]' }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, variants: '[{"name":"R","price":10.5}]' }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, variants: "not json" }).success).toBe(false);
  });
});

describe("placeOrderSchema", () => {
  it("rejects empty carts and bad quantities", () => {
    expect(placeOrderSchema.safeParse({ items: [] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ items: [{ variantId: "v", quantity: 0 }] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ items: [{ variantId: "v", quantity: 2 }] }).success).toBe(true);
  });
});

describe("settingsSchema", () => {
  it("limits tax percent", () => {
    expect(settingsSchema.safeParse({ shopName: "X", taxPercent: "60" }).success).toBe(false);
    expect(settingsSchema.parse({ shopName: "X", taxPercent: "16", isOpen: "on" })).toMatchObject({ taxPercent: 16, isOpen: true });
  });
});
