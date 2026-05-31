# Circuitkar — Development Progress Tracker

Last updated: 2026-05-31

---

## Phase 1 — Core E-commerce (Complete ✅)

- [x] Product catalog with search, filters, sort
- [x] Product detail pages with images, specs, rich text
- [x] Category pages
- [x] Cart (guest + authenticated, session merge on login)
- [x] Checkout: address selection, GST invoice toggle, review & pay
- [x] Razorpay payment (test + live mode switchable in admin)
- [x] Order confirmation page + email
- [x] Customer auth: signup, login, OTP, forgot/reset password
- [x] Account dashboard: profile, addresses, order history
- [x] Admin panel: products CRUD, blog CRUD, orders, settings
- [x] Supabase backend (auth, DB, storage)
- [x] Resend email integration
- [x] Announcement bar, maintenance mode, prelaunch mode
- [x] WhatsApp float button
- [x] robots.txt + sitemap.xml
- [x] Open Graph metadata

---

## Phase 2 — Operations (Complete ✅)

- [x] Cart qty lag fix (debounce, no race condition)
- [x] Admin products: rows-per-page (10/25/50) + column sorting
- [x] Dynamic shipping charge (from admin settings, default ₹100)
- [x] Stock quantity limits in cart, checkout, and order APIs
- [x] GSTIN saved to customer profile DB, prefilled at checkout
- [x] Razorpay mode UI in admin (Test/Live toggle with ACTIVE badge)
- [x] Test order flag on orders (badge in admin)
- [x] Order number format: PREFIX-DDMMYY-0001 (configurable prefix)
- [x] Order status workflow: confirmed→accepted→packed→shipped→delivered
- [x] Forward-only status enforcement (no reversals, cancel always allowed)
- [x] Admin order detail page: status actions, shipping form, timeline
- [x] Inventory decrement on order, restore on cancel
- [x] inventory_events audit log table
- [x] Invoice export page with CSV (date range, status filter, single/bulk)
- [x] Admin settings: order prefix, low stock threshold, shipping charge
- [x] Admin navigation: Invoices section added
- [x] llms.txt (AI crawler index)
- [x] robots.txt: GPTBot/ClaudeBot/PerplexityBot explicitly allowed
- [x] Richer metadata (keywords, description, max-image-preview)
- [x] Status emails: shipping confirmation, cancellation, delivery
- [x] Admin notification email on new order
- [x] Shiprocket webhook: status sync → update order + email customer
- [x] Razorpay webhook: payment captured/failed/refund handling
- [x] Admin login: removed personal email placeholder

---

## Phase 3 — Production Hardening (In Progress 🔄)

### Security
- [x] middleware.ts: server-side route protection (admin + account + checkout)
- [x] Security headers in middleware (X-Frame-Options, nosniff, Referrer-Policy)
- [ ] Rate limiting on public APIs (contact, interests, cart add)
- [ ] Input sanitization with zod on checkout/cart APIs
- [ ] CSRF token for state-changing non-API forms
- [ ] Admin 2FA / session timeout enforcement

### Error Handling
- [x] Root error.tsx boundary
- [x] Admin error.tsx boundary
- [x] Products loading.tsx skeleton
- [x] Admin loading.tsx skeleton
- [ ] API route error logging (structured log to Supabase or external service)
- [ ] Sentry or equivalent error tracking integration

### Email
- [x] Order confirmation (customer)
- [x] Shipping confirmation (customer)
- [x] Delivery confirmation (customer)
- [x] Order cancellation (customer)
- [x] Admin notification on new order
- [x] Refund notification (customer, via Razorpay webhook)
- [ ] Abandoned cart recovery email (24h after cart abandoned)
- [ ] Low stock alert email to admin
- [ ] Restock notification to interested customers (existing: notify-me flow)

### Webhooks
- [x] Razorpay webhook: payment.captured, payment.failed, refund
- [x] Shiprocket webhook: shipped, delivered, RTO
- [ ] RAZORPAY_WEBHOOK_SECRET env var must be set in Vercel + Razorpay dashboard

---

## Phase 4 — Customer Features ✅

### Coupons / Discounts
- [x] POST /api/coupons/validate — validate + calculate discount
- [x] GET/POST /api/admin/coupons — admin CRUD
- [x] PATCH/DELETE /api/admin/coupons/[id]
- [x] Admin coupon management UI: list, create, toggle active, delete, expiry, usage stats
- [x] Checkout page: coupon input field in review step, discount applied to Razorpay amount
- [x] Order creation: store coupon_code + discount_amount
- [x] Coupon usage_count incremented on order
- [x] DB migration: coupons table (database/phase4_migration.sql)
- [x] Orders table: coupon_code, discount_amount columns

### Product Reviews & Ratings
- [x] DB migration: product_reviews table
- [x] GET/POST /api/products/reviews — public read, auth write (verified purchase detection)
- [x] Admin: GET/PATCH /api/admin/reviews — approve/reject
- [x] Admin reviews page: pending/approved tabs, bulk approve/reject
- [x] Product detail page: ProductReviews component (star display, write review form)
- [x] Review moderation toggle in admin settings

### Wishlist
- [x] DB migration: wishlists table
- [x] GET/POST/DELETE /api/account/wishlist
- [x] Heart toggle button on ProductCard (hidden until hover)
- [x] Account page: /account/wishlist — grid view with add to cart + remove
- [x] AccountLayout: Wishlist nav item added

### Inventory Management
- [x] Stock decrement on order (API)
- [x] Stock restore on cancel (API)
- [x] inventory_events audit log
- [x] GET/PATCH /api/admin/inventory — product stock list + stock adjustment
- [x] Admin inventory page: filter (all/low/out), inline edit, adjust stock modal, events log
- [x] Low stock threshold configurable in admin settings

---

## Phase 5 — Admin Features ✅

### Order Management
- [x] Order status workflow (confirmed→accepted→packed→shipped→delivered)
- [x] Forward-only enforcement (API + table select shows only valid next statuses)
- [x] Shipping details modal in table when marking as "shipped" (courier + AWB required)
- [x] Shipping form on order detail page
- [x] Status timeline with timestamps + notes
- [x] Bulk status export (CSV) with date range filter
- [x] Print invoice page per order (/admin/orders/[orderNumber]/invoice) — printable HTML
- [x] Customer order lookup (Admin → Customers → customer → all orders)

### Product Management
- [x] Product CRUD (name, price, stock, images, specs)
- [x] HSN code field + cost price on product form
- [x] Admin product detail view: click product name → orders + stock ledger + KPIs
- [x] Product names in list link to detail view

### Analytics Dashboard
- [x] Revenue: Today / This Week / This Month / All Time
- [x] Top 5 products by qty sold + revenue
- [x] Orders by status breakdown
- [x] Average order value
- [x] Total orders KPI

### Customers Admin
- [x] /admin/customers — list with search, order count, total spent
- [x] /admin/customers/[id] — profile + full order history + KPIs

### Coupons Admin UI
- [x] /admin/coupons — list with usage stats, create form, toggle active, delete
- [x] All in admin nav

---

## Phase 6 — SEO / AEO / GEO ✅

- [x] robots.txt with explicit AI crawler permissions (GPTBot, ClaudeBot, PerplexityBot)
- [x] llms.txt (live AI index with product count + categories)
- [x] sitemap.xml with products, categories, blog + cache headers
- [x] Product JSON-LD: schema.org/Product with Offer (InStock/OutOfStock, priceValidUntil, seller)
- [x] BreadcrumbList JSON-LD on product pages
- [x] Organization schema on homepage
- [x] WebSite schema with SearchAction on homepage
- [x] OpenGraph + Twitter card on all pages
- [x] Rich metadata (keywords, max-image-preview:large)
- [ ] AggregateRating in product JSON-LD (activate once reviews accumulate)
- [ ] FAQ schema on product pages (content needed first)
- [ ] Canonical URLs (Next.js metadataBase handles most cases already)

---

## DB Migrations to Run

Run these SQL files in Supabase Dashboard → SQL Editor **in order**:

1. `database/schema.sql` — Initial schema
2. `database/seed.sql` — Seed data
3. `database/phase2_migration.sql` — Phase 2 enhancements
4. `database/phase3_migration.sql` — Order enhancements, inventory_events table
5. `database/phase4_migration.sql` — Coupons, reviews, wishlist, HSN codes, RLS policies

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://circuitkar.in
RAZORPAY_KEY_ID=           # fallback (use admin settings instead)
RAZORPAY_KEY_SECRET=       # fallback (use admin settings instead)
RAZORPAY_WEBHOOK_SECRET=   # from Razorpay dashboard → Webhooks
RESEND_API_KEY=            # fallback (use admin settings instead)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```

---

## Supabase Settings (Admin Panel → Settings)

| Key | Where set |
|-----|-----------|
| order_number_prefix | Store tab → "Order Number Prefix" |
| free_shipping_threshold | Store tab |
| shipping_charge | Store tab → "Flat Shipping Charge" |
| low_stock_threshold | Store tab → "Low Stock Alert Threshold" |
| admin_email | Store tab → "Admin Email" |
| store_email | Store tab → "Store Email" |
| razorpay_use_live | Payments tab (Test/Live toggle) |
| razorpay_key_id_test | Payments tab |
| razorpay_key_secret_test | Payments tab |
| razorpay_key_id_live | Payments tab |
| razorpay_key_secret_live | Payments tab |
| resend_api_key | Email tab |
| resend_from_email | Email tab |
| send_order_emails | Email tab (toggle) |

---

## Known Issues / Tech Debt

- Shiprocket integration: webhooks wire up, but auto-create shipment on order is not automatic (admin must do it manually or enable auto-create in settings)
- Cart merge (guest → authenticated) relies on session header; works but could be more robust
- No database transactions on order creation (race condition at very high volume — use Postgres function or row-level locking for true 300 orders/day safety)
- Admin auth relies on Supabase admin_users table check in requireAdmin(); middleware adds first-level protection
- No file size limits on image upload (add in production)



## Remaining / Nice to Have (True Gaps)

- [x] Blog admin: server-side pagination, search, sort, rows-per-page (DONE — matches products admin)
- [x] Account orders list: all 7 statuses with proper color mapping (DONE)
- [x] Admin orders API: `accepted` + `packed` added to VALID_STATUSES filter (DONE)
- [ ] Product bulk CSV import
- [ ] Product duplicate/clone button
- [ ] Abandoned cart recovery email (requires a scheduled cron / Edge Function)
- [ ] Low stock alert email to admin (trigger on order when stock < threshold)
- [ ] AggregateRating JSON-LD — activate once reviews accumulate in DB
- [ ] Admin 2FA / session timeout enforcement
- [ ] Rate limiting on public APIs (Upstash ratelimit or Vercel Edge middleware)
- [ ] Sentry / error monitoring integration