# AGENTS.md — FoodPoint

The single source of truth for anyone (human or AI agent) working on this repo. Read it fully before making changes.

## 1. Project overview
FoodPoint is the website for a single fast food shop (burgers, pizza, etc.). It has two sides:

- **Shop (customer side)**: customers sit at a table, scan the table's QR code, browse the menu, add items to a cart and place a **dine-in** order. They **pay cash at the counter**. No customer accounts.
- **Admin side** (`/admin`): staff manage the menu (products, images, sizes/prices), tables + QR codes, live orders, staff accounts and shop settings.

### Product decisions (locked for Phase 1)
| Topic | Decision |
|---|---|
| Order type | Dine-in only (QR per table). No delivery/takeaway yet |
| Payment | Cash at counter. Admin marks order as `PAID` |
| Branches | Single shop. Don't add branch logic yet, but don't make it hard to add later |
| Customer auth | None. Table comes from the QR cookie; the order is tracked by its order number |
| Menu | Categories → Products → Variants (sizes). Every product has ≥ 1 variant |
| Currency | PKR, displayed as `Rs 1,250`. Stored as **Int rupees** |
| New-order alert | Admin order board polls every 5–10 s and plays a sound + badge |
| Admin roles | `OWNER` (everything) and `STAFF` (orders only) |

## 2. Tech stack
- **Next.js 15** (App Router, React Server Components, Server Actions), **TypeScript (strict)**
- **Prisma ORM** + **Neon Postgres (free tier)**
- **Auth.js / NextAuth v5**: Credentials provider, bcrypt password hashes, role stored in the JWT session
- **Cloudinary (free)**: product/category images (signed uploads from admin)
- **Tailwind CSS v4** + small hand-written shadcn-style components in `src/components/ui` (no Radix), **lucide-react** icons, **sonner** toasts
- **Zod v4**: validation shared by forms and server
- **qrcode**: generating table QR PNGs
- **Vitest** (unit tests in `src/**/*.test.ts`); end-to-end flows are checked with Playwright MCP
- Hosting: **Vercel** (app) + Neon (DB) + Cloudinary (images), all on free tiers

## 3. Folder structure
```
src/
  app/
    page.tsx                menu (site root; wraps itself in ShopShell)
    (shop)/                 other customer pages, layout = ShopShell
      t/[tableCode]/        route handler: sets table cookie from QR, redirects to menu
      cart/                 cart + place order
      order/[orderNumber]/  live order status (auto-refresh)
    admin/
      page.tsx              redirects by role
      login/
      print/[orderId]/      kitchen ticket (no admin chrome)
      (protected)/          layout runs requireUser(); OWNER pages also call requireUser("OWNER")
        dashboard/ orders/ products/ categories/ tables/ staff/ settings/
    api/
      auth/[...nextauth]/   Auth.js handlers
      cloudinary/sign/      signed upload params (OWNER only)
      orders/poll/          pending-order summary polled by the admin nav (sound + badge)
  components/
    ui/                     primitives: button, input, card, modal, action-form
    shop/                   customer-side components (cart context, menu, cart)
    admin/                  admin-side components (nav, order card, product form, image upload)
  server/
    db.ts                   Prisma client singleton
    auth.ts                 Auth.js config
    guard.ts                requireUser() for pages, assertUser() for actions/APIs
    actions/                Server Actions ("use server"): menu.ts, admin.ts, shop.ts; safe.ts wraps errors
    services/               business logic + DB queries (orders, menu, settings)
  lib/
    validators/             Zod schemas
    money.ts                formatPKR()
    order-math.ts           calculateTotals() — shared by cart preview and server
    order-status.ts         status labels + allowed transitions
prisma/
  schema.prisma
  seed.ts                   owner account + sample menu + tables T1–T4
```

Admin pages are protected in the page/layout and again in every Server Action and API route; there is no middleware.

## 4. Data model (summary)
- `User`: name, email (unique), passwordHash, role `OWNER|STAFF`, active
- `Category`: name, slug, imagePublicId?, sortOrder, active
- `Product`: categoryId, name, slug, description, imagePublicId?, sortOrder, active
- `ProductVariant`: productId, name ("Regular"/"Small"/"Large"), price Int, sortOrder, active
- `DiningTable`: label ("T1"), code (random, unguessable slug used in QR URL), active
- `Order`: orderNumber (short, human-readable, unique), tableId, status, note?, subtotal, tax, total (Int), timestamps
- `OrderItem`: orderId, variantId, **snapshot** fields `productName`, `variantName`, `unitPrice`, qty, lineTotal
- `Setting` (single row): shopName, logoPublicId?, isOpen, taxPercent, openingHours

Order status flow: `PENDING → ACCEPTED → PREPARING → SERVED → PAID`, and `CANCELLED` from any non-final state.

## 5. Commands
```bash
npm install
npm run dev              # http://localhost:3000
npm run build
npm run lint
npm run typecheck        # tsc --noEmit
npm run test             # vitest
npm run db:migrate       # prisma migrate dev (create/apply migration, uses DIRECT_URL)
npm run db:deploy        # prisma migrate deploy (production)
npm run db:seed          # owner account + sample menu + tables
npm run db:studio        # browse the DB
```
The `db:*` scripts load `.env.local` via dotenv-cli; plain `npx prisma ...` does not.

## 6. Environment variables
Local values live in `.env.local` (git-ignored). Keep `.env.example` up to date and never commit `.env` / `.env.local`. Prisma CLI commands are wired to read `.env.local`.
```
DATABASE_URL=            # Neon pooled connection string (-pooler host)
DIRECT_URL=              # Neon direct connection string (for migrations)
AUTH_SECRET=             # openssl rand -base64 32
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SITE_URL=    # used to build table QR URLs
SEED_OWNER_EMAIL=
SEED_OWNER_PASSWORD=
```

## 7. Coding conventions
- TypeScript strict; no `any` without a comment explaining why.
- **Server Components by default.** Add `"use client"` only for interactivity (cart, forms, polling).
- **Mutations go through Server Actions** in `src/server/actions/*`. Each admin action: `safeAction(async () => { assertUser(role) → Zod parse → DB/service → revalidatePath → return "message" })`. Client forms use `<ActionForm>` (shows toast, keeps input on error).
- **DB access only in `src/server/**`.** Never import Prisma in client components.
- **Money is `Int` rupees.** Never use floats for prices. Format only at display time with `formatPKR()`.
- Images: store the Cloudinary `public_id`, build URLs with `imageUrl()` (Cloudinary resizes, `f_auto,q_auto`). Render with `<FoodImage>` (`next/image` with `unoptimized`, so Vercel's free image quota is not used).
- Validation schemas live in `src/lib/validators` and are used by Server Actions; add HTML attributes (`required`, `min`, `maxLength`) in forms for quick feedback.
- Naming: components `PascalCase.tsx`, everything else `kebab-case.ts`; DB fields `camelCase`.
- Mobile-first UI. The customer side must work well on a 360 px wide phone.
- Small, focused commits; Conventional Commit messages (`feat:`, `fix:`, `chore:`…).

## 8. Security rules (must follow)
- Every admin Server Action and API route **re-checks session + role on the server**. Hiding a button doesn't count as protection.
- STAFF may only read/update orders. Everything else is OWNER-only.
- **Never trust client prices.** When placing an order, the server loads variants from the DB, checks they're active, and recalculates the totals.
- Order placement: validate the table cookie against an active `DiningTable`, reject when `Setting.isOpen` is false, and apply a simple rate limit per table.
- Order items store snapshot names/prices, so later price changes never alter old orders.
- Passwords hashed with bcrypt; no secrets in code or logs.

## 9. Definition of done
- `npm run lint`, `npm run typecheck`, `npm run test` pass (and `npm run build` for larger changes)
- Feature works at mobile width and desktop width
- Loading, empty and error states handled
- New env vars added to `.env.example`; schema changes have a migration
- No secrets committed

## 10. Roadmap
**Phase 1 (current), MVP dine-in ordering**
- Shop: QR table entry, menu with categories + sizes, cart, place order, live order status, "shop closed" banner
- Admin: login + roles, dashboard stats, live orders board (sound, status updates, mark paid, print ticket), products/variants CRUD with image upload, categories CRUD, tables + QR download, staff management, settings
- Foundation: seed data, `.env.example`, README setup guide, Vercel deploy

**Phase 2**: takeaway + home delivery (address, delivery fee), add-ons/extras, deals/combos, discount prices, sales reports, WhatsApp/email alerts
**Phase 3**: online payments (JazzCash/EasyPaisa/Stripe), customer accounts + history, promo codes, reviews
**Phase 4**: multi-branch, inventory, kitchen display screen, PWA, Urdu language

Only build what belongs to the current phase. Note ideas for later phases here instead of half-implementing them.
