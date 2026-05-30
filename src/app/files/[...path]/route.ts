import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy route: /files/[...path] → Supabase Storage public URL
 * e.g. circuitkar.in/files/datasheets/esp32.pdf
 *       → https://<project>.supabase.co/storage/v1/object/public/product-files/datasheets/esp32.pdf
 *
 * Supports two buckets:
 *   product-images → /files/images/...
 *   product-files  → /files/datasheets/... or /files/docs/...
 *   blog-images    → /files/blog/...
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || !path?.length) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const pathStr = path.join("/");

  // Map path prefix to bucket
  let bucket = "product-files";
  if (pathStr.startsWith("images/")) bucket = "product-images";
  else if (pathStr.startsWith("blog/")) bucket = "blog-images";

  const storageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathStr}`;

  // Stream the file from Supabase Storage
  const upstream = await fetch(storageUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const blob = await upstream.blob();

  return new NextResponse(blob, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": contentType.includes("pdf")
        ? `inline; filename="${path[path.length - 1]}"`
        : "inline",
    },
  });
}
