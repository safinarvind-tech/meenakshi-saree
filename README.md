# Sri Meenakshi Silk House — e-commerce

Customer storefront + admin panel for a Kanchipuram silk saree brand, built from the approved **Quiet Luxury** design (`design/quiet-luxury/`).

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Razorpay · Docker

## What's included

| Storefront | Admin (`/admin`) |
|---|---|
| Home, shop with filters/search/sort, product page with gallery | Dashboard (today's orders, 30-day sales, low stock) |
| Blouse options (unstitched / stitched / designer) and add-ons (fall & pico, gift wrap) | Products: create/edit, photo upload (auto-resized to WebP), main photo, archive |
| Cart, checkout with coupon, **Razorpay** (UPI, cards, net banking) and **Cash on Delivery** | Orders: status, payment, courier + tracking, notes, cancel (restocks automatically) |
| Order confirmation page | Categories, coupons, video-call bookings, customers |
| Video-call shopping booking, story, saree care, contact, policy pages | Roles: Owner, Manager, Staff |

Built-in safeguards: prices and stock are always re-checked on the server; stock is reserved atomically, so the last saree can't be sold twice; unpaid online orders release their stock after 30 minutes; Razorpay payments are verified by signature and by webhook.

## Local development

Requirements: Node.js 20.9+ and PostgreSQL.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate          # create tables
npm run db:seed             # categories, owner account, WELCOME10 coupon, 15 sample sarees
npm run dev                 # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

Useful commands: `npm run typecheck`, `npm run lint`, `npm run test:orders` (order/stock integration test), `npm run db:studio` (browse the database).

> Sample product photos come from Pexels/Unsplash (free licence) and are placeholders. Replace them with the brand's own photos from the admin.

## Free hosting (Render + Neon + Supabase) — for demos

No card needed. Render's free plan sleeps after 15 minutes without visitors (first visit then takes about a minute), so use this for showing the client, and the VPS below for the real launch.

1. **Neon** (database): create a project in region *Asia Pacific (Singapore)*. On the dashboard click **Connect**, turn **Connection pooling off**, and copy the connection string.
2. **Supabase** (photos): create a project in region *South Asia (Mumbai)*. **Storage → New bucket** named `products`, tick **Public bucket**. From **Project Settings → API Keys** copy the **secret key**, and from **Project Settings → Data API** the **Project URL**.
3. **Render**: **New → Blueprint**, connect this GitHub repo; Render reads `render.yaml`. Fill in `DATABASE_URL` (Neon), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ characters), `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `NEXT_PUBLIC_SITE_URL` (`https://<service-name>.onrender.com`). Deploy. On start the container creates the tables and the owner account.
4. Optional, sample sarees: create `.env.production` locally with the same `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, then run `npm run db:seed:production`.

## Deploying (Hostinger VPS + Coolify, paid in INR)

1. Buy a **Hostinger KVM 2 VPS** (Mumbai) with the **Coolify** template.
2. In Coolify: **+ New → PostgreSQL**. Copy its internal connection URL.
3. **+ New → Application → your GitHub repo**, build pack **Dockerfile**.
4. Environment variables (see `.env.example`): `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, and the Razorpay keys when ready.
5. **Storages → add a volume** mounted at `/app/storage` (keeps uploaded product photos across deploys).
6. Set your domain, enable HTTPS, deploy. On start the container runs database migrations and creates the owner account automatically.
7. Point the domain's DNS to Cloudflare (free) and add an A record to the VPS IP.
8. Back up PostgreSQL daily (Coolify → Database → Backups).

The same Docker image also runs on Render, Railway, DigitalOcean or AWS.

### Razorpay
1. Complete KYC (needs the policy pages live: `/policies/shipping`, `/policies/returns`, `/policies/privacy`, `/policies/terms`).
2. Add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (test keys first). The "Pay online" option appears automatically.
3. Dashboard → Webhooks → `https://YOUR-DOMAIN/api/razorpay/webhook`, events `payment.captured` and `order.paid`, and set `RAZORPAY_WEBHOOK_SECRET`.

## Before launch: things to confirm with the client
Highlighted text on `/contact` and `/policies/*` (address, phone, GSTIN, return window, dispatch times, COD limit), real product photos and data, and the GST rate/HSN code with their accountant.

## Next phases
Customer accounts with phone OTP (MSG91), WhatsApp/email order notifications, Shiprocket shipping labels and tracking, GST invoice PDFs, reviews, homepage banner editor.
