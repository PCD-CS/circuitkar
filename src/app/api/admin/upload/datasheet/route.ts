import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";

const BUCKET = "product-files";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED = ["application/pdf", "application/zip", "text/plain"];

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const productId = (form.get("productId") as string) || "misc";

  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (!ALLOWED.includes(file.type) && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF/ZIP/TXT allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File exceeds 20MB." }, { status: 400 });

  const supabase = createAdminClient();
  const path = `datasheets/${productId}/${Date.now()}_${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "application/pdf", upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Return a /files/ URL so datasheets appear on circuitkar.in domain
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://circuitkar.in";
  const filesUrl = `${siteUrl}/files/${path}`;
  return NextResponse.json({ url: filesUrl }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url." }, { status: 400 });

  // Strip the site prefix to get the storage path
  const marker = "/files/";
  const idx = url.indexOf(marker);
  if (idx === -1) return NextResponse.json({ error: "Invalid url." }, { status: 400 });

  const path = decodeURIComponent(url.slice(idx + marker.length));
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
