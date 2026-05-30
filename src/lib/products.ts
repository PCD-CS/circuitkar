import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Category,
  CategoryWithCount,
  ProductSort,
  ProductWithCategory,
} from "@/types";

const PRODUCT_SELECT = "*, category:categories(*)";

export interface ProductQuery {
  category?: string; // category slug
  search?: string;
  sort?: ProductSort;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

function applySort<T extends { order: (...args: never[]) => T }>(
  query: T,
  sort: ProductSort | undefined,
): T {
  switch (sort) {
    case "price-asc":
      return query.order("price" as never, { ascending: true } as never);
    case "price-desc":
      return query.order("price" as never, { ascending: false } as never);
    case "newest":
      return query.order("created_at" as never, { ascending: false } as never);
    case "featured":
    default:
      return query
        .order("is_featured" as never, { ascending: false } as never)
        .order("created_at" as never, { ascending: false } as never);
  }
}

export async function getProducts(opts: ProductQuery = {}): Promise<{
  products: ProductWithCategory[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = createAdminClient();
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const pageSize = opts.pageSize && opts.pageSize > 0 ? opts.pageSize : 60;

  let categoryId: string | undefined;
  if (opts.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", opts.category)
      .maybeSingle();
    categoryId = cat?.id;
    if (!categoryId) {
      return { products: [], total: 0, page, pageSize };
    }
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.search) {
    query = query.or(
      `name.ilike.%${opts.search}%,short_description.ilike.%${opts.search}%`,
    );
  }

  query = applySort(query, opts.sort);
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    products: (data as unknown as ProductWithCategory[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as unknown as ProductWithCategory) ?? null;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<ProductWithCategory[]> {
  if (!categoryId) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(limit);
  return (data as unknown as ProductWithCategory[]) ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as Category[]) ?? [];
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = createAdminClient();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id").eq("is_active", true),
  ]);
  const counts = new Map<string, number>();
  for (const p of prods ?? []) {
    if (p.category_id)
      counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return (cats ?? []).map((c) => ({
    ...(c as Category),
    product_count: counts.get((c as Category).id) ?? 0,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category) ?? null;
}
