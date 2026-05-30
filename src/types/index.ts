export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryWithCount extends Category {
  product_count: number;
}

export type Specifications = Record<string, string>;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  category_id: string | null;
  images: string[] | null;
  datasheet_url: string | null;
  specifications: Specifications | null;
  tags: string[] | null;
  in_stock: boolean;
  stock_count: number;
  is_featured: boolean;
  is_active: boolean;
  weight_grams: number | null;
  interest_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: Category | null;
}

export interface ProductInterest {
  id: string;
  product_id: string;
  email: string;
  name: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface ProductInterestWithProduct extends ProductInterest {
  product: Pick<Product, "id" | "name" | "slug"> | null;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number | null;
  shipping_charge: number;
  total: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shiprocket_order_id: string | null;
  shiprocket_tracking: string | null;
  notes: string | null;
  customer_id: string | null;
  address_id: string | null;
  gstin: string | null;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string | null;
  updated_at: string;
}

export type SettingsMap = Record<string, string>;

// ---- API response shapes ----

export interface ApiError {
  error: string;
}

export interface InterestPostResponse {
  success: true;
  count: number;
  position: number;
}

export interface InterestCountResponse {
  count: number;
}

export interface ProductListResponse {
  products: ProductWithCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export type ProductSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest";

// ---- Phase 2 types ----

export type AccountType = "personal" | "business";

export interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  account_type: AccountType;
  business_name: string | null;
  gstin: string | null;
  pan: string | null;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  customer_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
}

export interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  product: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "compare_price" | "images" | "in_stock"
  >;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string[] | null;
  is_published: boolean;
  published_at: string | null;
  author_name: string;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type LaunchMode = "prelaunch" | "maintenance" | "live";
