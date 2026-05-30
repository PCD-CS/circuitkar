import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlogForm } from "@/components/admin/BlogForm";
import type { BlogPost } from "@/types";

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const post = data as BlogPost;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="mb-4 flex items-center gap-1 text-sm text-[#525252] transition-colors hover:text-[#A3A3A3]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <h1 className="font-mono text-xl font-bold text-[#F5F5F5]">Edit Post</h1>
      </div>
      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        <BlogForm post={post} />
      </div>
    </div>
  );
}
