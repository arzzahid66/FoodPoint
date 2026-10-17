import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

const SAMPLE_MENU = [
  {
    name: "Burgers",
    products: [
      { name: "Zinger Burger", description: "Crispy fried chicken fillet, lettuce and mayo.", variants: [["Regular", 550]] },
      { name: "Beef Smash Burger", description: "Double smashed beef patty with cheese.", variants: [["Single", 750], ["Double", 1050]] },
      { name: "Chicken Tikka Burger", description: "Grilled tikka chicken with mint sauce.", variants: [["Regular", 600]] },
    ],
  },
  {
    name: "Pizza",
    products: [
      { name: "Chicken Tikka Pizza", description: "Tikka chicken, onions, green peppers.", variants: [["Small", 650], ["Medium", 1200], ["Large", 1700]] },
      { name: "Fajita Pizza", description: "Fajita chicken, capsicum, onions.", variants: [["Small", 650], ["Medium", 1200], ["Large", 1700]] },
      { name: "Margherita", description: "Tomato sauce and mozzarella.", variants: [["Small", 550], ["Medium", 999], ["Large", 1450]] },
    ],
  },
  {
    name: "Sides",
    products: [
      { name: "Fries", description: "Golden salted fries.", variants: [["Regular", 250], ["Large", 380]] },
      { name: "Chicken Wings (6 pcs)", description: "Hot & spicy wings.", variants: [["Regular", 590]] },
    ],
  },
  {
    name: "Drinks",
    products: [
      { name: "Soft Drink", description: "Chilled cold drink.", variants: [["Regular", 120], ["1.5 Litre", 280]] },
      { name: "Mint Margarita", description: "Fresh mint and lemon.", variants: [["Regular", 350]] },
    ],
  },
] as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const email = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in .env.local");
  if (password.length < 8) throw new Error("SEED_OWNER_PASSWORD must be at least 8 characters");

  // Creates the owner, or makes sure the existing account is an active owner. Never overwrites the password.
  await db.user.upsert({
    where: { email },
    update: { role: "OWNER", active: true },
    create: { name: "Owner", email, role: "OWNER", passwordHash: await bcrypt.hash(password, 10) },
  });
  await db.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  console.log(`Owner account ready: ${email}`);

  if ((await db.category.count()) === 0) {
    for (const [ci, cat] of SAMPLE_MENU.entries()) {
      await db.category.create({
        data: {
          name: cat.name,
          slug: slugify(cat.name),
          sortOrder: ci,
          products: {
            create: cat.products.map((p, pi) => ({
              name: p.name,
              slug: slugify(p.name),
              description: p.description,
              sortOrder: pi,
              variants: { create: p.variants.map(([name, price], vi) => ({ name, price, sortOrder: vi })) },
            })),
          },
        },
      });
    }
    console.log("Sample menu added (edit or delete it from the admin).");
  }

  if ((await db.diningTable.count()) === 0) {
    for (let i = 1; i <= 4; i++) {
      await db.diningTable.create({ data: { label: `T${i}`, code: randomBytes(6).toString("hex") } });
    }
    console.log("Tables T1–T4 added.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
