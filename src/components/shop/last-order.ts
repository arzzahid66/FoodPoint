"use client";

import * as React from "react";

const KEY = "fp_last_order";
const EVENT = "fp-last-order";

export function saveLastOrder(orderNumber: string) {
  try {
    localStorage.setItem(KEY, orderNumber);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

/** The customer's most recent order number on this device, for the "My order" link. */
export function useLastOrder() {
  const [value, setValue] = React.useState<string | null>(null);
  React.useEffect(() => {
    const read = () => {
      try {
        setValue(localStorage.getItem(KEY));
      } catch {
        setValue(null);
      }
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  return value;
}
