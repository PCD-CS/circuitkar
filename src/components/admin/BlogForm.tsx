"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useToast } from "@/components/ui/Toast";
import { slugify } from "@/lib/utils";
import type { BlogPost } from "@/types";

export function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!post;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [authorName, setAuthorName] = useState(post?.author_name ?? "Circuitkar Team");
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? "");
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  async function uploadCover(file: File) {
    setUploadingCover(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload/blog-image", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setUploadingCover(false);
    if (res.ok) setCoverImage(data.url);
    else toast(data.error || "Upload failed.", "error");
  }

  async function save(publishOverride?: boolean) {
    if (!title.trim()) {
      toast("Title is required.", "error");
      return;
    }
    setSaving(true);
    const body = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim() || null,
      content,
      cover_image: coverImage || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author_name: authorName.trim() || "Circuitkar Team",
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      is_published: publishOverride ?? isPublished,
    };
    const url = isEdit ? `/api/admin/blog/${post!.id}` : "/api/admin/blog";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast(data.error || "Could not save.", "error");
      return;
    }
    toast("Post saved.");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugManual(true);
              setSlug(e.target.value);
            }}
            className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 font-mono text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none"
          />
        </div>
      </div>

      <Textarea
        label="Excerpt"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows={2}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">
          Cover Image
        </label>
        {coverImage ? (
          <div className="relative inline-block">
            <div className="relative h-40 w-full max-w-md overflow-hidden rounded-lg border border-[#262626]">
              <Image src={coverImage} alt="Cover" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setCoverImage("")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white hover:bg-[#EF4444]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => coverInputRef.current?.click()}
            className="flex max-w-md cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#262626] bg-[#111111] px-4 py-8 text-center hover:border-[#525252]"
          >
            {uploadingCover ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
            ) : (
              <UploadCloud className="h-6 w-6 text-[#525252]" />
            )}
            <p className="text-sm text-[#A3A3A3]">Upload a cover image</p>
          </div>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadCover(f);
          }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">
          Content
        </label>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tutorial, arduino"
        />
        <Input
          label="Author"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label="SEO Title"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <Input
          label="SEO Description"
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#A3A3A3]">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 accent-[#F97316]"
        />
        Published
      </label>

      <div className="flex flex-wrap gap-3 border-t border-[#262626] pt-4">
        <Button type="submit" loading={saving}>
          {isEdit ? "Save Changes" : "Create Post"}
        </Button>
        {!isPublished && (
          <Button
            type="button"
            variant="secondary"
            loading={saving}
            onClick={() => {
              setIsPublished(true);
              save(true);
            }}
          >
            Save &amp; Publish
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/blog")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
