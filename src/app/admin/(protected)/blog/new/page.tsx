import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BlogForm } from "@/components/admin/BlogForm";

export const metadata: Metadata = { title: "New Post" };

export default function NewBlogPostPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="mb-4 flex items-center gap-1 text-sm text-[#525252] transition-colors hover:text-[#A3A3A3]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <h1 className="font-mono text-xl font-bold text-[#F5F5F5]">New Post</h1>
      </div>
      <div className="rounded-lg border border-[#262626] bg-[#161616] p-6">
        <BlogForm />
      </div>
    </div>
  );
}
