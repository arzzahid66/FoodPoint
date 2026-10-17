import { describe, expect, it } from "vitest";
import { calculateTotals } from "./order-math";
import { canTransition } from "./order-status";
import { formatPKR } from "./money";

describe("calculateTotals", () => {
  it("sums lines without tax", () => {
    expect(
      calculateTotals(
        [
          { unitPrice: 550, quantity: 2 },
          { unitPrice: 120, quantity: 3 },
        ],
        0,
      ),
    ).toEqual({ subtotal: 1460, tax: 0, total: 1460 });
  });

  it("adds rounded tax", () => {
    expect(calculateTotals([{ unitPrice: 999, quantity: 1 }], 16)).toEqual({ subtotal: 999, tax: 160, total: 1159 });
  });

  it("handles an empty cart", () => {
    expect(calculateTotals([], 10)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe("canTransition", () => {
  it("only allows the next step forward", () => {
    expect(canTransition("PENDING", "ACCEPTED")).toBe(true);
    expect(canTransition("PENDING", "PAID")).toBe(false);
    expect(canTransition("SERVED", "PAID")).toBe(true);
  });

  it("allows cancelling only active orders", () => {
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
    expect(canTransition("PAID", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "CANCELLED")).toBe(false);
  });
});

describe("formatPKR", () => {
  it("formats whole rupees with separators", () => {
    expect(formatPKR(1250)).toBe("Rs 1,250");
  });
});
