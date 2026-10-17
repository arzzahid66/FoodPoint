"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { assertUser } from "@/server/guard";
import { safeAction, UserError } from "@/server/actions/safe";
import { categorySchema, productSchema } from "@/lib/validators/menu";
import { formToObject } from "@/lib/validators/common";
import { randomCode, slugify } from "@/lib/utils";

function refresh() {
  revalidatePath("/", "layout");
}

// ── Categories ────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const data = categorySchema.parse(formToObject(formData));
    await db.category.create({ data: { ...data, slug: slugify(data.name) || randomCode(6).toLowerCase() } });
    refresh();
    return `Category "${data.name}" added`;
  });
}

export async function updateCategory(id: string, formData: FormData) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const data = categorySchema.parse(formToObject(formData));
    await db.category.update({ where: { id }, data: { ...data, slug: slugify(data.name) || undefined } });
    refresh();
    return "Category saved";
  });
}

export async function deleteCategory(id: string) {
  return safeAction(async () => {
    await assertUser("OWNER");
    const count = await db.product.count({ where: { categoryId: id } });
    if (count > 0) throw new UserError("Move or delete the products in this category first.");
    await db.category.delete({ where: { id } });
    refresh();
    return "Category deleted";
  });
}

// ── Products ──────────────────────────────────────────────────

async function uniqueProductSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "item";
  const taken = await db.product.findFirst({ where: { slug: base, NOT: excludeId ? { id: excludeId } : undefined } });
  return taken ? `${base}-${randomCode(4).toLowerCase()}` : base;
}

export async function saveProduct(id: string | null, formData: FormData) {
  const result = await safeAction(async () => {
    await assertUser("OWNER");
    const { variants, ...data } = productSchema.parse(formToObject(formData));
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new UserError("Choose a valid category");

    if (!id) {
      await db.product.create({
        data: {
          ...data,
          slug: await uniqueProductSlug(data.name),
          variants: { create: variants.map((v, i) => ({ name: v.name, price: v.price, sortOrder: i })) },
        },
      });
      return "Product added";
    }

    const existing = await db.productVariant.findMany({ where: { productId: id }, select: { id: true } });
    const existingIds = new Set(existing.map((v) => v.id));
    // Only trust variant ids that really belong to this product.
    const kept = variants.filter((v) => v.id && existingIds.has(v.id));
    const keptIds = new Set(kept.map((v) => v.id));

    await db.$transaction([
      db.product.update({ where: { id }, data: { ...data, slug: await uniqueProductSlug(data.name, id) } }),
      db.productVariant.deleteMany({ where: { productId: id, id: { notIn: [...keptIds] as string[] } } }),
      ...variants.map((v, i) =>
        v.id && keptIds.has(v.id)
          ? db.productVariant.update({ where: { id: v.id }, data: { name: v.name, price: v.price, sortOrder: i } })
          : db.productVariant.create({ data: { productId: id, name: v.name, price: v.price, sortOrder: i } }),
      ),
    ]);
    return "Product saved";
  });

  if (result.ok) {
    refresh();
    redirect("/admin/products");
  }
  return result;
}

export async function toggleProduct(id: string, active: boolean) {
  return safeAction(async () => {
    await assertUser("OWNER");
    await db.product.update({ where: { id }, data: { active } });
    refresh();
    return active ? "Product is now visible on the menu" : "Product hidden from the menu";
  });
}

export async function deleteProduct(id: string) {
  return safeAction(async () => {
    await assertUser("OWNER");
    await db.product.delete({ where: { id } });
    refresh();
    return "Product deleted";
  });
}
