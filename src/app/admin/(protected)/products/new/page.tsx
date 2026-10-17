import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { saveProduct } from "@/server/actions/menu";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireUser("OWNER");
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  if (categories.length === 0) redirect("/admin/categories");
  return (
    <div>
      <PageHeader title="Add product" />
      <ProductForm action={saveProduct.bind(null, null)} categories={categories} />
    </div>
  );
}
