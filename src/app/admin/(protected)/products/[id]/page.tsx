import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { saveProduct } from "@/server/actions/menu";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("OWNER");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${product.name}`} />
      <ProductForm
        action={saveProduct.bind(null, product.id)}
        categories={categories}
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          description: product.description,
          imagePublicId: product.imagePublicId,
          sortOrder: product.sortOrder,
          active: product.active,
          variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
        }}
      />
    </div>
  );
}
