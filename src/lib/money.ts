const formatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Prices are stored as whole rupees (Int). Format only at display time. */
export function formatPKR(amount: number) {
  return `Rs ${formatter.format(amount)}`;
}
