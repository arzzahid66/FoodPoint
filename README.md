# FoodPoint

Dine-in ordering website for a fast food shop. Customers scan a QR code on their table, order from the menu and pay at the counter. The owner manages the menu, prices, photos, tables and orders from `/admin`.

Built with Next.js 15, Prisma, Neon Postgres, Auth.js and Cloudinary. See [AGENTS.md](AGENTS.md) for architecture and conventions.

## Setup

1. **Install**
   ```bash
   npm install
   ```
2. **Environment**: copy `.env.example` to `.env.local` and fill in every value:
   - `DATABASE_URL`: Neon → Connect → connection pooling **on** (host contains `-pooler`)
   - `DIRECT_URL`: Neon → Connect → connection pooling **off**
   - `AUTH_SECRET`: run `npx auth secret` or use any long random string
   - `CLOUDINARY_*` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary → Settings → API Keys
   - `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` locally, your real domain in production (used in the QR codes)
   - `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`: your first admin login (password at least 8 characters)
3. **Database**
   ```bash
   npm run db:migrate   # creates the tables in Neon
   npm run db:seed      # owner login + sample menu + tables T1–T4
   ```
4. **Run**
   ```bash
   npm run dev
   ```
   - Shop: http://localhost:3000
   - Admin: http://localhost:3000/admin (log in with the seed owner email + password)

To test ordering on your computer, open **Admin → Tables & QR** and visit a table's link (`/t/...`) in the browser. That is what scanning the QR does.

## Deploy (Vercel, free)

1. Push the repo to GitHub and import it in Vercel.
2. Add all variables from `.env.local` to Vercel → Project → Settings → Environment Variables, with `NEXT_PUBLIC_SITE_URL` set to your Vercel/real domain.
3. Run `npm run db:deploy` against the production database when you add migrations.
4. Print the table QR codes **after** setting the real domain.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` / `npm test` | Quality checks |
| `npm run db:migrate` | Create/apply DB migrations (dev) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed owner account + sample data |
| `npm run db:studio` | Browse the database |
