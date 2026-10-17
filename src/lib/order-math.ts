export type PricedLine = { unitPrice: number; quantity: number };

export function calculateTotals(lines: PricedLine[], taxPercent: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const tax = Math.round((subtotal * taxPercent) / 100);
  return { subtotal, tax, total: subtotal + tax };
}
