import "server-only";
import { db } from "@/server/db";

/** Public menu: only active categories, products and variants, in display order. */
export async function getPublicMenu() {
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { active: true, variants: { some: { active: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { variants: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
      },
    },
  });
  return categories.filter((c) => c.products.length > 0);
}

export type PublicMenu = Awaited<ReturnType<typeof getPublicMenu>>;

export async function getActiveTableByCode(code: string | undefined) {
  if (!code) return null;
  const table = await db.diningTable.findUnique({ where: { code } });
  return table?.active ? table : null;
}
