# Circuitkar — Phase 2 Complete Build Prompt for Claude Code

## Context

This is a Next.js 14+ / Supabase project already running. Phase 1 is complete and live:
- Product catalog with 45 SKUs (all out of stock)
- Notify Me / interest capture system
- Admin panel (products, interests, settings, orders stub)
- Dark theme, Space Mono + DM Sans fonts, orange accent (#F97316)

**Do not break or rewrite anything already working.** This prompt adds new features on top of the existing codebase. All new code must match the existing design system exactly.

---

## What This Prompt Builds (Phase 2)

1. Product images — admin upload to Supabase Storage
2. Product descriptions — rich text in admin, rendered on product pages
3. Customer auth — Email/Password + Email OTP (SMS OTP slot reserved)
4. Customer accounts — profile, addresses, GST, business/personal toggle
5. Full cart system — persistent, works logged in or guest
6. Checkout flow — address, GST, summary (Razorpay stubbed, controlled by admin switch)
7. Order management — customer side (view orders, track)
8. Blog system — full CRUD in admin, public blog pages
9. Global admin settings — all keys via admin panel, maintenance mode, launch switch
10. All CRUD with search, pagination, proper UX throughout

---

## Design System (Existing — Match Exactly)

```css
--bg-primary: #0A0A0A
--bg-secondary: #111111
--bg-card: #161616
--bg-elevated: #1E1E1E
--accent: #F97316
--accent-hover: #EA6C0A
--accent-subtle: #F9731615
--text-primary: #F5F5F5
--text-secondary: #A3A3A3
--text-muted: #525252
--border: #262626
--border-subtle: #1A1A1A
--success: #22C55E
--error: #EF4444
--warning: #F59E0B
```

Fonts: Space Mono (headings/display), DM Sans (body), JetBrains Mono (specs/code)
Border radius: max 8px. No bubbly UI. Industrial-precision aesthetic.
All new components must feel identical to existing ones.

---

## 1. Product Images — Supabase Storage Upload

### Supabase Storage Setup
Create bucket `product-images` (public bucket, no auth required to read).

### Admin Product Form Changes
Replace current image URL text inputs with:
- Drag-and-drop upload zone (or click to select)
- Accept: jpg, jpeg, png, webp — max 5MB per image
- Up to 5 images per product
- Show upload progress bar (orange)
- After upload: thumbnail preview grid with × delete button per image
- Images stored at path: `product-images/{product_id}/{timestamp}_{filename}`
- On delete: remove from Supabase Storage AND from product's images array in DB
- Keep existing URL input as fallback (labelled "Or paste external URL")
- Reorder images via drag (first image = primary/display image)

### Product Pages (Public)
- Replace grey placeholder boxes with actual `<Image>` components
- Primary image large on left
- Thumbnail strip below — click to switch main image
- If no image: show existing placeholder (don't break)
- Lightbox on click (simple: darken background, centered large image, ESC/click to close)

### Product Cards (Grid)
- Show primary image (images[0]) with Next.js Image, object-cover
- Fallback to placeholder if no images

---

## 2. Product Descriptions — Rich Text

### Admin
- Replace plain textarea with a simple rich text editor
- Use **Tiptap** (install: `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder`)
- Toolbar: Bold, Italic, Heading (H2, H3), Bullet list, Numbered list, Link, Code block, Horizontal rule
- Styled to match dark theme (toolbar bg: `--bg-elevated`, border: `--border`)
- Saves as HTML string to `description` column (already text type in DB)
- `short_description` stays as plain textarea (1-2 lines, used in cards)

### Product Detail Page (Public)
- Render description HTML safely using `dangerouslySetInnerHTML` inside a styled `prose` div
- Add custom Tailwind prose overrides for dark theme:
  - headings: `--text-primary`
  - body: `--text-secondary`
  - links: `--accent`
  - code blocks: `--bg-elevated` background, monospace font
  - tables: bordered, dark

---

## 3. Database Schema Additions

Run these migrations (add to a new file `database/phase2_migration.sql`):

```sql
-- Customer profiles (extends Supabase auth.users)
create table customer_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  account_type text default 'personal', -- 'personal' or 'business'
  -- Business fields
  business_name text,
  gstin text,
  pan text,
  -- Preferences
  email_notifications boolean default true,
  whatsapp_notifications boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customer addresses
create table customer_addresses (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customer_profiles(id) on delete cascade,
  label text default 'Home', -- Home, Work, Other
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text default 'India',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Cart (persistent, works for both guests and logged-in users)
create table carts (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customer_profiles(id) on delete cascade,
  session_id text, -- for guests
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity int not null default 1,
  added_at timestamptz default now(),
  unique(cart_id, product_id)
);

-- Update orders table to add customer link
alter table orders add column if not exists customer_id uuid references customer_profiles(id);
alter table orders add column if not exists address_id uuid references customer_addresses(id);
alter table orders add column if not exists gstin text;
alter table orders add column if not exists business_name text;

-- Blog
create table blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text, -- HTML from Tiptap
  cover_image text,
  tags text[],
  is_published boolean default false,
  published_at timestamptz,
  author_name text default 'Circuitkar Team',
  seo_title text,
  seo_description text,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Global settings expansion (add new keys via upsert in seed)
-- Keys to add:
-- razorpay_key_id, razorpay_key_secret, razorpay_live (bool)
-- shiprocket_email, shiprocket_password
-- resend_api_key
-- launch_mode: 'prelaunch' | 'live' | 'maintenance'
-- maintenance_message
-- free_shipping_threshold
-- whatsapp_number
-- announcement_text, announcement_enabled
-- razorpay_key_id_live, razorpay_key_secret_live

-- RLS Policies
alter table customer_profiles enable row level security;
alter table customer_addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table blog_posts enable row level security;

create policy "Users manage own profile" on customer_profiles
  for all using (auth.uid() = id);

create policy "Users manage own addresses" on customer_addresses
  for all using (auth.uid() = customer_id);

create policy "Users manage own cart" on carts
  for all using (auth.uid() = customer_id or session_id is not null);

create policy "Public read published posts" on blog_posts
  for select using (is_published = true);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into customer_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## 4. Customer Auth System

### Strategy
- Supabase Auth handles everything
- **Email OTP:** Supabase magic link / OTP via email (built-in, zero extra cost)
- **Email + Password:** Standard Supabase auth
- **SMS OTP:** Architecture stub only — `lib/sms.ts` with placeholder function `sendSMSOTP(phone, otp)` that logs to console. Slot ready for Twilio/MSG91 later.
- User can choose login method on login page

### Pages & Routes

**`/auth/login`**
- Two tabs: "Password" | "Email OTP"
- Password tab: Email + Password fields, Submit, "Forgot password?" link
- OTP tab: Email field → Submit → shows OTP input (6-digit) → Verify
- Below both: "Don't have an account? Sign up" link
- Social login placeholder (commented out, slot for Google OAuth later)
- On success: redirect to `/account` or to the page they came from (`returnTo` param)

**`/auth/signup`**
- Full Name (required)
- Email (required)
- Password (required, min 8 chars, show strength indicator)
- Phone (optional, labelled "For order updates — optional now")
- Account Type radio: Personal | Business
- If Business selected, show:
  - Business Name (required)
  - GSTIN (optional, validate format: 15 char alphanumeric)
  - PAN (optional)
- Checkbox: "I agree to Terms & Privacy Policy"
- On submit: Supabase `signUp` → sends confirmation email → show "Check your email" screen
- After email confirmed: profile auto-created via trigger

**`/auth/forgot-password`**
- Email input → sends Supabase password reset email

**`/auth/reset-password`**
- New password + confirm (handles Supabase redirect with token)

**`/auth/verify`**
- Handles email OTP verification callback
- Shows spinner → redirects on success

### Middleware Updates
- `middleware.ts`: protect `/account/*` — redirect to `/auth/login?returnTo=[path]` if not authenticated
- Admin routes stay protected via existing admin auth

### Header Updates
- If logged out: show `[Login]` button (ghost, small)
- If logged in: show avatar/initials dropdown with: My Account, My Orders, Logout

---

## 5. Customer Account Section

All routes under `/account/*` — protected, requires login.

**`/account`** (Dashboard)
- Welcome: "Hello, [Name]"
- Quick stats: Total Orders | Pending | Delivered
- Recent orders list (last 3) with status badge
- Quick links: Profile, Addresses, Orders

**`/account/profile`**
- Edit: Full Name, Phone
- Account Type toggle: Personal ↔ Business (with confirmation modal — "Switching will update your invoice type")
- If Business: Business Name, GSTIN, PAN — editable with GSTIN format validation
- Email Notifications toggle
- WhatsApp Notifications toggle (greyed out if phone not added)
- Change Password section (separate card): Current password, New password, Confirm
- Delete Account (danger zone, bottom, requires typing "DELETE" to confirm)
- Save button — Supabase update on `customer_profiles`

**`/account/addresses`**
- List of saved addresses — cards with label badge (Home/Work/Other)
- Default address marked with orange star
- Each card: Edit | Delete | Set as Default actions
- Add New Address button → modal form:
  - Label (Home/Work/Other + custom text option)
  - Full Name, Phone
  - Address Line 1, Line 2 (optional)
  - City, State (dropdown — all Indian states), Pincode
  - Set as default checkbox
- Pincode → auto-fetch city/state via Indian Pincode API (`https://api.postalpincode.in/pincode/{pin}`) — fills city/state automatically
- Max 5 addresses per account

**`/account/orders`**
- Paginated list (10 per page)
- Search by order number
- Filter by status (All / Pending / Confirmed / Shipped / Delivered / Cancelled)
- Each row: Order # | Date | Items summary | Total | Status badge | [View] button

**`/account/orders/[orderNumber]`**
- Order details page
- Items list with image, name, qty, price
- Order timeline (placed → confirmed → shipped → delivered) — visual step indicator
- Shipping address used
- GST invoice details (if GSTIN was provided)
- Tracking number + Shiprocket link (if available)
- "Need help?" → WhatsApp link pre-filled with order number

---

## 6. Cart System

### Architecture
- Cart persists in Supabase `carts` + `cart_items` tables
- Logged-in users: cart tied to `customer_id`
- Guest users: cart tied to `session_id` (UUID stored in localStorage)
- On login: merge guest cart into user cart (if guest had items)
- Cart state managed via React Context (`CartContext`) + Supabase realtime or refetch on mount

### Cart Context (`lib/cart-context.tsx`)
```typescript
interface CartContext {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (productId: string, qty?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQty: (productId: string, qty: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
}
```

### Cart UI

**Cart Icon in Header**
- Shows item count badge (orange dot with number)
- Click opens cart drawer (slide in from right)

**Cart Drawer**
- List of items: image, name, qty stepper (−/+), price, × remove
- Subtotal
- Free shipping progress bar: "Add ₹[X] more for free shipping" (threshold from settings)
- Two buttons: `[Continue Shopping]` and `[Proceed to Checkout]`
- If `launch_mode` is NOT `live`: checkout button shows "Coming Soon — We're launching soon!" tooltip on hover, button is orange but disabled
- Empty cart: illustration + "Your cart is empty" + [Browse Products] button

**`/cart`** (Full cart page — same as drawer but full page)
- Same items list, larger layout
- Order summary card on right (desktop)
- Coupon code field (stub — input exists, shows "No coupons available yet" on submit)

---

## 7. Checkout Flow

Route: `/checkout` — requires login (redirect to `/auth/login?returnTo=/checkout`)

### Step 1 — Delivery Address
- List saved addresses (selectable cards)
- "Use a new address" option — inline form (same as account address form)
- GST Invoice section (collapsible card):
  - Toggle: "I want a GST invoice"
  - If toggled ON: show GSTIN field (pre-filled from profile if available), Business Name
  - Label: "GST invoice will be emailed after order is placed"
- [Continue to Review] button

### Step 2 — Order Review
- Items list (readonly)
- Delivery address summary (with [Change] link)
- Price breakdown:
  - Subtotal
  - Shipping (Free / ₹X based on threshold)
  - GST (18% on applicable items — show breakdown)
  - **Total**
- Payment section:
  - If `launch_mode = live` AND Razorpay configured in admin:
    - `[Pay ₹{total} with Razorpay]` button
    - Razorpay checkout opens on click
    - On success: create order in DB, redirect to `/account/orders/[number]`
  - If `launch_mode` is NOT `live`:
    - Orange info box: "We're almost ready! Orders will open soon. Your cart is saved."
    - Button disabled with label "Coming Soon"
- Place order flow (when live):
  1. Create Razorpay order via `/api/razorpay/create-order`
  2. Open Razorpay checkout
  3. On payment success: POST to `/api/orders/create` with all details
  4. Create Shiprocket order via `/api/shiprocket/create-order` (if configured)
  5. Send confirmation email via Resend
  6. Redirect to success page

**`/checkout/success`**
- Order number prominent
- "Your order has been placed!" 
- Estimated delivery: 3-5 business days
- [View Order] + [Continue Shopping] buttons
- Confetti animation (simple CSS, not a library)

---

## 8. Blog System

### Admin Blog (`/admin/blog`)

**List page:**
- Table: Title | Status | Published Date | Views | Actions (Edit, Delete, Preview)
- Toggle published/draft directly in table
- Search by title
- Pagination (10 per page)
- [New Post] button

**New/Edit (`/admin/blog/new`, `/admin/blog/[id]/edit`):**
- Title (auto-generates slug, editable)
- Slug (editable)
- Excerpt (plain textarea, 160 chars max, used for SEO + cards)
- Cover Image (upload to Supabase Storage bucket `blog-images`, same upload component as products)
- Content (Tiptap rich text editor — same as product description)
- Tags (comma-separated pill input)
- Author Name (pre-filled "Circuitkar Team", editable)
- SEO Title (optional, defaults to title)
- SEO Description (optional, defaults to excerpt)
- Status: Draft | Published
- Published Date (auto-set to now on first publish, editable)
- Save Draft / Publish buttons

### Public Blog Pages

**`/blog`**
- Grid of published posts (3 columns desktop, 2 tablet, 1 mobile)
- Each card: cover image, tag(s), title, excerpt (2 lines), date, read time estimate
- Search bar (filters client-side or server-side)
- Tag filter pills
- Pagination (9 per page)
- SEO: title "Electronics Blog — Circuitkar", description, OG tags

**`/blog/[slug]`**
- Full post page
- Cover image (full width, max height 400px, object-cover)
- Title (Space Mono, large)
- Author + Date + Read time + View count
- Tags (pills)
- Content (rendered HTML, dark prose styles)
- Share buttons: WhatsApp, Twitter/X, Copy Link
- Related posts (same tags, 3 posts, at bottom)
- Back to blog link
- SEO: full meta, OG image = cover image, JSON-LD BlogPosting schema

---

## 9. Global Admin Settings Panel (Overhaul)

Replace existing settings page with a tabbed settings panel at `/admin/settings`.

All settings stored in `settings` table (key-value). Admin reads/writes all config here. Application reads sensitive keys server-side only via Supabase service role.

### Tab 1 — Store & Launch

| Setting | Type | Description |
|---|---|---|
| Launch Mode | Radio: `prelaunch` / `live` / `maintenance` | Controls checkout, buying |
| Maintenance Message | Textarea | Shown during maintenance mode |
| Announcement Bar Text | Text input | Top bar message |
| Announcement Bar Enabled | Toggle | Show/hide bar |
| Store Name | Text | "Circuitkar" |
| Store Email | Text | Support email |
| WhatsApp Number | Text | With country code |
| Free Shipping Threshold | Number (₹) | Above this = free shipping |
| Admin Email | Text | For order notifications |

**Launch Mode behavior (enforced via middleware + API checks):**
- `prelaunch`: Cart works, checkout shows "Coming Soon", buying disabled
- `live`: Full checkout and buying enabled
- `maintenance`: Banner shown, cart/account accessible, checkout disabled, product browsing works, admin accessible

### Tab 2 — Payments (Razorpay)

| Setting | Type |
|---|---|
| Razorpay Key ID (Test) | Text (masked) |
| Razorpay Key Secret (Test) | Password input (masked) |
| Razorpay Key ID (Live) | Text (masked) |
| Razorpay Key Secret (Live) | Password input (masked) |
| Use Live Keys | Toggle |

- All stored encrypted in settings table (use simple base64 for now, note to upgrade to proper encryption)
- Show/hide toggle on password fields (eye icon)
- "Test Connection" button — makes a test Razorpay API call and shows ✓ / ✗

### Tab 3 — Shipping (Shiprocket)

| Setting | Type |
|---|---|
| Shiprocket Email | Text |
| Shiprocket Password | Password (masked) |
| Default Pickup Location | Text |
| Auto-create Shiprocket orders | Toggle |

- "Test Connection" button

### Tab 4 — Email (Resend)

| Setting | Type |
|---|---|
| Resend API Key | Password (masked) |
| From Email | Text (e.g. orders@circuitkar.in) |
| From Name | Text (e.g. Circuitkar) |
| Send order confirmation emails | Toggle |
| Send notify-me emails | Toggle |

- "Send Test Email" button — sends test to admin email

### Tab 5 — SEO & Integrations

| Setting | Type |
|---|---|
| Google Analytics ID | Text (G-XXXXXXXXXX) |
| Google Search Console verification | Text |
| Facebook Pixel ID | Text |
| Meta description (homepage) | Textarea |

### Tab 6 — Admin Account

- Change admin password
- Admin email
- Session timeout (hours)

**All tabs:**
- Save button per tab (not one global save)
- Unsaved changes indicator (orange dot on tab)
- Success toast on save

---

## 10. Additional Public Pages

### Updated Homepage
- If `launch_mode = prelaunch`: show announcement bar + hero "Launching Soon" badge
- If `launch_mode = maintenance`: show full-page maintenance overlay (admin can still access /admin)
- If `launch_mode = live`: normal homepage

### `/about`
- Company story section
- "Why Circuitkar" (4 values)
- Team section (placeholder cards — admin can't edit this yet, hardcode for now)
- GST and registration info

### `/contact`
- Contact form (Name, Email, Subject, Message) → sends via Resend to admin email
- WhatsApp button (prominent)
- Office location (Silvassa / Borivali — use general city, not exact address)
- Response time note: "We usually respond within 2-4 hours on WhatsApp"

### `/track-order`
- Input: Order number + Email
- Looks up order in DB, shows status + Shiprocket tracking link
- Works without login

---

## 11. API Routes to Add/Update

```
app/api/
  auth/
    merge-cart/route.ts         -- Merge guest cart on login
  cart/
    route.ts                    -- GET (fetch cart), POST (add item)
    [itemId]/route.ts           -- PUT (update qty), DELETE (remove)
    clear/route.ts              -- DELETE (clear cart)
  checkout/
    route.ts                    -- POST: validate cart, calc totals
  orders/
    create/route.ts             -- POST: create order after payment
    [orderNumber]/route.ts      -- GET: order details (customer auth)
  razorpay/
    create-order/route.ts       -- POST: create Razorpay order
    verify/route.ts             -- POST: verify payment signature
  shiprocket/
    create-order/route.ts       -- POST: create shipment
    track/route.ts              -- GET: tracking status
  blog/
    route.ts                    -- GET: list published posts
    [slug]/route.ts             -- GET: single post + increment view
  admin/
    blog/
      route.ts                  -- GET + POST (admin auth)
      [id]/route.ts             -- PUT + DELETE (admin auth)
    settings/
      route.ts                  -- Full overhaul: GET + PUT with tabs
    upload/
      product-image/route.ts    -- POST: upload to Supabase Storage
      blog-image/route.ts       -- POST: upload blog cover
  pincode/
    [pin]/route.ts              -- GET: fetch city/state from postal API
  contact/
    route.ts                    -- POST: send contact form email
  track/
    route.ts                    -- GET: public order tracking
```

---

## 12. Email Templates (Resend)

Create `lib/emails/` folder with React Email templates (install `@react-email/components react-email`):

**`order-confirmation.tsx`**
- Dark themed, matches brand
- Order number, date
- Items table (image, name, qty, price)
- Shipping address
- Total breakdown
- Track order button (links to /track-order)
- Footer: circuitkar.in | WhatsApp | Unsubscribe

**`notify-me-confirmation.tsx`**
- "You're on the list for [Product Name]"
- Product image
- "We'll email you the moment it's in stock"
- Browse other products button

**`notify-me-restock.tsx`**
- "Good news! [Product Name] is now in stock"
- Product image, price
- Buy Now button
- Limited stock warning if stock < 10

**`password-reset.tsx`**
- Reset link button
- Expires in 1 hour note

---

## 13. Component Additions

```
components/
  auth/
    AuthGuard.tsx           -- Wraps protected pages, redirects if not authed
    LoginForm.tsx           -- Reusable (used in modal + page)
    SignupForm.tsx
    OTPInput.tsx            -- 6-box OTP input component
  cart/
    CartDrawer.tsx          -- Slide-in cart
    CartItem.tsx
    CartSummary.tsx
    CartContext.tsx         -- Provider + hook
  checkout/
    AddressSelector.tsx
    GSTForm.tsx
    OrderReview.tsx
    PaymentSection.tsx
  account/
    AccountLayout.tsx       -- Sidebar nav for account pages
    AddressCard.tsx
    AddressForm.tsx         -- Modal form
    OrderCard.tsx
    OrderTimeline.tsx
  blog/
    BlogCard.tsx
    BlogGrid.tsx
    BlogSearch.tsx
  upload/
    ImageUploader.tsx       -- Drag-drop + preview + Supabase upload
    ImageReorder.tsx        -- Drag to reorder uploaded images
  ui/
    Tabs.tsx                -- Tab component for settings
    Stepper.tsx             -- Qty stepper (−/qty/+)
    ProgressBar.tsx         -- For free shipping progress
    Confetti.tsx            -- CSS confetti for order success
    RichTextEditor.tsx      -- Tiptap wrapper, dark theme
    RichTextRenderer.tsx    -- Safe HTML renderer with dark prose
```

---

## 14. SEO Additions

- All new pages: full `metadata` export
- Blog posts: JSON-LD `BlogPosting` schema
- Product pages: JSON-LD `Product` schema with `offers` (out of stock)
- `/sitemap.xml`: include blog posts
- OG images: use `/api/og` route with `@vercel/og` for dynamic OG images (product name + price on dark background)

---

## 15. Performance & UX Details

**Loading states:**
- Every data fetch has a skeleton
- Cart drawer shows skeleton while loading
- Account pages show skeleton on mount

**Error states:**
- Every form has field-level error messages
- API errors show toast notifications (red)
- Network errors: retry button

**Optimistic updates:**
- Cart add/remove updates UI immediately, syncs to DB in background
- If sync fails: revert + show error toast

**Pagination:**
- All lists (orders, blog, products in admin): server-side, URL-param based (`?page=2`)
- Preserve filters + search in URL params

**Indian UX specifics:**
- Phone number field: auto-format as Indian number (10 digits, no country code input needed)
- All prices: ₹ symbol, Indian number formatting (1,00,000 not 100,000)
- States dropdown: all 28 states + 8 UTs of India
- Pincode: auto-lookup city + state

**Accessibility:**
- All interactive elements keyboard navigable
- Focus rings visible (orange, matching accent)
- Screen reader labels on icon-only buttons
- Error messages linked to inputs via `aria-describedby`

---

## 16. File Structure Additions

```
app/
  auth/
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify/page.tsx
  account/
    layout.tsx
    page.tsx
    profile/page.tsx
    addresses/page.tsx
    orders/
      page.tsx
      [orderNumber]/page.tsx
  cart/page.tsx
  checkout/
    page.tsx
    success/page.tsx
  blog/
    page.tsx
    [slug]/page.tsx
  track-order/page.tsx (update existing)
  admin/
    blog/
      page.tsx
      new/page.tsx
      [id]/
        edit/page.tsx
    settings/page.tsx (full overhaul)

lib/
  cart-context.tsx
  emails/
    order-confirmation.tsx
    notify-me-confirmation.tsx
    notify-me-restock.tsx
    password-reset.tsx
  sms.ts              -- SMS OTP stub
  razorpay.ts         -- Razorpay helpers
  shiprocket.ts       -- Shiprocket API helpers
  resend.ts           -- Email send helpers
  settings.ts         -- Server-side settings fetcher (reads from DB)
  indian-states.ts    -- Array of all Indian states + UTs

database/
  phase2_migration.sql
```

---

## 17. Environment Variables to Add

Add to `.env.local.example`:

```bash
# These are now also configurable via admin panel
# Admin panel settings override these env vars at runtime

# Resend
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=orders@circuitkar.in
RESEND_FROM_NAME=Circuitkar

# Vercel OG (for dynamic OG images)
# No extra key needed, uses @vercel/og

# SMS OTP (stub — add when ready)
# MSG91_AUTH_KEY=
# MSG91_SENDER_ID=
# MSG91_TEMPLATE_ID=
```

---

## Critical Rules for This Build

1. **Do not modify** any existing working feature unless it needs updating to support new features (e.g., header needs cart icon added)
2. **Match design system exactly** — no new colors, no new fonts, same border radius, same card style
3. **All forms validate** — both client-side (immediate feedback) and server-side (API returns proper errors)
4. **All admin routes** are protected — any new `/admin/*` page checks admin session
5. **All customer routes** — `/account/*` and `/checkout` check customer session
6. **Settings from DB** — when `launch_mode`, Razorpay keys, etc. are read, always read from `settings` table via server-side fetch, never hardcode
7. **TypeScript strict** — no `any` types, proper interfaces for all data shapes
8. **Mobile first** — every new page is fully usable on 375px viewport
9. **No placeholder TODOs** in core flows — auth, cart, checkout, orders, blog must all work end-to-end
10. **`database/phase2_migration.sql`** must be self-contained and runnable in Supabase SQL editor in one shot

---

## Deliverable

A complete, production-ready Next.js project where:

1. Customer can sign up (email+password or email OTP)
2. Add products to cart (works as guest too)
3. Save addresses with pincode auto-lookup
4. Add GST details, switch personal/business
5. Proceed to checkout → see "Coming Soon" (prelaunch mode) OR complete payment (live mode)
6. View their orders and track them
7. Admin can write and publish blog posts
8. Admin can upload product images and write rich descriptions
9. Admin controls everything — launch mode, payment keys, shipping keys, emails — from the settings panel
10. Everything is paginated, searchable, and handles empty/error states gracefully
