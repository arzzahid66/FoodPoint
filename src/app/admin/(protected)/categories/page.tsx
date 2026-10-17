import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/ui/action-form";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { requireUser } from "@/server/guard";
import { db } from "@/server/db";
import { createCategory, deleteCategory, updateCategory } from "@/server/actions/menu";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireUser("OWNER");
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Categories" description="Menu sections like Burgers, Pizza, Drinks. Lower sort numbers show first." />

      <Card className="mb-6 p-5">
        <ActionForm action={createCategory} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Field label="New category" htmlFor="new-name">
              <Input id="new-name" name="name" placeholder="e.g. Burgers" required maxLength={60} />
            </Field>
          </div>
          <div className="w-24">
            <Field label="Sort" htmlFor="new-sort">
              <Input id="new-sort" name="sortOrder" type="number" min={0} defaultValue={categories.length} />
            </Field>
          </div>
          <input type="hidden" name="active" value="on" />
          <SubmitButton>Add</SubmitButton>
        </ActionForm>
      </Card>

      {categories.length === 0 ? (
        <EmptyState title="No categories yet">Add your first one above, for example “Burgers”.</EmptyState>
      ) : (
        <Card className="divide-y divide-zinc-100">
          {categories.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <ActionForm action={updateCategory.bind(null, c.id)} className="flex flex-1 flex-wrap items-center gap-3">
                <Input name="name" defaultValue={c.name} aria-label="Category name" required maxLength={60} className="min-w-40 flex-1" />
                <Input name="sortOrder" type="number" min={0} defaultValue={c.sortOrder} aria-label="Sort order" className="w-20" />
                <Checkbox name="active" label="Visible" defaultChecked={c.active} />
                <span className="text-xs text-zinc-500">{c._count.products} items</span>
                <SubmitButton variant="outline" size="sm">
                  Save
                </SubmitButton>
              </ActionForm>
              <ActionForm action={deleteCategory.bind(null, c.id)}>
                <ConfirmSubmit
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${c.name}`}
                  title={`Delete ${c.name}?`}
                  message="Only empty categories can be deleted."
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </ConfirmSubmit>
              </ActionForm>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
