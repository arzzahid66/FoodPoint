import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/ui/action-form";
import { FoodImage } from "@/components/food-image";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { deleteProduct, toggleProduct } from "@/server/actions/menu";
import { formatPKR } from "@/lib/money";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireUser("OWNER");
  const [products, categoryCount] = await Promise.all([
    db.product.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } }, variants: { orderBy: { sortOrder: "asc" } } },
    }),
    db.category.count(),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Add items, upload photos and change prices. Changes show on the menu right away."
        actions={
          categoryCount > 0 && (
            <Link href="/admin/products/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Add product
            </Link>
          )
        }
      />
      {categoryCount === 0 ? (
        <EmptyState title="Create a category first">
          Products belong to categories like Burgers or Pizza.{" "}
          <Link href="/admin/categories" className="font-semibold text-brand-dark underline">
            Add a category
          </Link>
        </EmptyState>
      ) : products.length === 0 ? (
        <EmptyState title="No products yet">Click “Add product” to create your first menu item.</EmptyState>
      ) : (
        <Card className="divide-y divide-zinc-100">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <FoodImage publicId={p.imagePublicId} alt={p.name} size={120} className="h-14 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-900">{p.name}</p>
                  {!p.active && <Badge>Hidden</Badge>}
                </div>
                <p className="text-xs text-zinc-500">{p.category.name}</p>
                <p className="mt-0.5 text-sm text-zinc-700">
                  {p.variants.map((v) => (p.variants.length > 1 ? `${v.name} ${formatPKR(v.price)}` : formatPKR(v.price))).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ActionForm action={toggleProduct.bind(null, p.id, !p.active)}>
                  <SubmitButton variant="ghost" size="sm" pendingText="...">
                    {p.active ? "Hide" : "Show"}
                  </SubmitButton>
                </ActionForm>
                <Link href={`/admin/products/${p.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
                <ActionForm action={deleteProduct.bind(null, p.id)}>
                  <ConfirmSubmit
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    title={`Delete ${p.name}?`}
                    message="It will be removed from the menu. Past orders keep their details."
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </ConfirmSubmit>
                </ActionForm>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
