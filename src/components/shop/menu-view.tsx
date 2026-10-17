"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FoodImage } from "@/components/food-image";
import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  imagePublicId: string | null;
  variants: { id: string; name: string; price: number }[];
};

export type MenuCategory = { id: string; name: string; slug: string; products: MenuProduct[] };

export function MenuView({ categories, canOrder }: { categories: MenuCategory[]; canOrder: boolean }) {
  const [selected, setSelected] = React.useState<MenuProduct | null>(null);
  const [activeSlug, setActiveSlug] = React.useState(categories[0]?.slug);
  const close = React.useCallback(() => setSelected(null), []);

  // Highlight the category tab for the section currently in view.
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSlug(visible.target.id);
      },
      { rootMargin: "-120px 0px -70% 0px" },
    );
    categories.forEach((c) => {
      const el = document.getElementById(c.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  return (
    <>
      <nav className="no-scrollbar sticky top-14 z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-[#fafafa] px-4 py-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${c.slug}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              activeSlug === c.slug
                ? "border-brand bg-brand text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
            )}
          >
            {c.name}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {categories.map((c) => (
          <section key={c.id} id={c.slug} className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-extrabold text-zinc-900">{c.name}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {c.products.map((p) => (
                <ProductCard key={p.id} product={p} canOrder={canOrder} onOpen={() => setSelected(p)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Modal open={!!selected} onClose={close} title={selected?.name}>
        {selected && <ProductPicker product={selected} canOrder={canOrder} onDone={close} />}
      </Modal>
    </>
  );
}

function ProductCard({ product, canOrder, onOpen }: { product: MenuProduct; canOrder: boolean; onOpen: () => void }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const hasSizes = product.variants.length > 1;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <FoodImage publicId={product.imagePublicId} alt={product.name} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col p-3">
        <p className="font-bold leading-tight text-zinc-900">{product.name}</p>
        {product.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-brand-dark">
            {hasSizes ? "from " : ""}
            {formatPKR(minPrice)}
          </span>
          {canOrder && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
              <Plus className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ProductPicker({ product, canOrder, onDone }: { product: MenuProduct; canOrder: boolean; onDone: () => void }) {
  const { add } = useCart();
  const [variantId, setVariantId] = React.useState(product.variants[0].id);
  const [qty, setQty] = React.useState(1);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <div>
      <FoodImage publicId={product.imagePublicId} alt={product.name} size={800} className="aspect-video w-full rounded-xl" />
      {product.description && <p className="mt-3 text-sm text-zinc-600">{product.description}</p>}

      {product.variants.length > 1 && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold text-zinc-800">Choose size</legend>
          <div className="space-y-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5",
                  v.id === variantId ? "border-brand bg-brand-soft" : "border-zinc-200",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="radio"
                    name="variant"
                    className="accent-brand"
                    checked={v.id === variantId}
                    onChange={() => setVariantId(v.id)}
                  />
                  {v.name}
                </span>
                <span className="text-sm font-semibold">{formatPKR(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {canOrder ? (
        <div className="mt-5 flex items-center gap-3">
          <QuantityStepper value={qty} onChange={setQty} />
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              add(
                {
                  variantId: variant.id,
                  productName: product.name,
                  variantName: variant.name,
                  price: variant.price,
                  imagePublicId: product.imagePublicId,
                },
                qty,
              );
              toast.success(`${product.name} added to cart`);
              onDone();
            }}
          >
            Add · {formatPKR(variant.price * qty)}
          </Button>
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-zinc-100 px-3 py-2 text-center text-sm text-zinc-600">
          Ordering is not available right now.
        </p>
      )}
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center rounded-lg border border-zinc-300">
      <button
        type="button"
        className="flex h-10 w-10 cursor-pointer items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button
        type="button"
        className="flex h-10 w-10 cursor-pointer items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= 50}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
