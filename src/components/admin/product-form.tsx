"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { ImageUpload } from "./image-upload";
import type { ActionState } from "@/lib/action-state";

type VariantRow = { key: string; id?: string; name: string; price: string };

export type ProductFormValues = {
  name: string;
  categoryId: string;
  description: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  active: boolean;
  variants: { id: string; name: string; price: number }[];
};

let keySeq = 0;
const newKey = () => `new-${++keySeq}`;

export function ProductForm({
  action,
  categories,
  initial,
}: {
  action: (formData: FormData) => Promise<ActionState | void>;
  categories: { id: string; name: string }[];
  initial?: ProductFormValues;
}) {
  const [variants, setVariants] = React.useState<VariantRow[]>(() =>
    initial?.variants.length
      ? initial.variants.map((v) => ({ key: v.id, id: v.id, name: v.name, price: String(v.price) }))
      : [{ key: newKey(), name: "Regular", price: "" }],
  );

  const update = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const applySizePreset = () =>
    setVariants(["Small", "Medium", "Large"].map((name) => ({ key: newKey(), name, price: "" })));

  const variantsJson = JSON.stringify(
    variants.map((v) => ({ id: v.id, name: v.name, price: v.price === "" ? 0 : Number(v.price) })),
  );

  return (
    <ActionForm action={action} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="space-y-4 p-5">
          <Field label="Product name" htmlFor="name">
            <Input id="name" name="name" defaultValue={initial?.name} placeholder="e.g. Zinger Burger" required maxLength={80} />
          </Field>
          <Field label="Category" htmlFor="categoryId">
            <Select id="categoryId" name="categoryId" defaultValue={initial?.categoryId ?? ""} required>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description (optional)" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              defaultValue={initial?.description ?? ""}
              placeholder="Crispy chicken fillet, lettuce, mayo..."
              maxLength={500}
            />
          </Field>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="mb-0">Sizes & prices (Rs)</Label>
              <p className="text-xs text-zinc-500">One row for a single price, or several rows for sizes.</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={applySizePreset}>
              Use Small / Medium / Large
            </Button>
          </div>
          <input type="hidden" name="variants" value={variantsJson} />
          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.key} className="flex gap-2">
                <Input
                  aria-label="Size name"
                  value={v.name}
                  onChange={(e) => update(v.key, { name: e.target.value })}
                  placeholder="Size name"
                  maxLength={40}
                  required
                />
                <Input
                  aria-label="Price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={v.price}
                  onChange={(e) => update(v.key, { price: e.target.value })}
                  placeholder="Price"
                  className="w-32 shrink-0"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove size"
                  disabled={variants.length === 1}
                  onClick={() => setVariants((rows) => rows.filter((r) => r.key !== v.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {variants.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setVariants((rows) => [...rows, { key: newKey(), name: "", price: "" }])}
            >
              <Plus className="h-4 w-4" /> Add size
            </Button>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <Label>Image</Label>
          <ImageUpload name="imagePublicId" defaultValue={initial?.imagePublicId} />
        </Card>
        <Card className="space-y-4 p-5">
          <Checkbox name="active" label="Show on menu" defaultChecked={initial?.active ?? true} />
          <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers show first.">
            <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial?.sortOrder ?? 0} />
          </Field>
        </Card>
        <div className="flex gap-2">
          <SubmitButton className="flex-1">{initial ? "Save changes" : "Add product"}</SubmitButton>
          <Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
      </div>
    </ActionForm>
  );
}
