"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { BlogPost } from "@/types";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[#F97316]" : "bg-[#262626]"
      }`}
    >
      <div
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const PAGE_SIZE = 15;

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function togglePublish(post: BlogPost) {
    setToggling(post.id);
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_published: !p.is_published } : p,
        ),
      );
    } else {
      toast("Could not update.", "error");
    }
    setToggling(null);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast("Post deleted.");
    } else {
      toast("Could not delete.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-[#F5F5F5]">Blog</h1>
          <p className="mt-1 text-sm text-[#525252]">{posts.length} posts</p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search posts"
          className="w-full rounded-lg border border-[#262626] bg-[#111111] py-2.5 pl-9 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[#161616]" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#262626] bg-[#111111]">
                <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-[#525252]">
                  Title
                </th>
                <th className="px-4 py-3 text-center text-xs font-mono uppercase tracking-wider text-[#525252]">
                  Published
                </th>
                <th className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-[#525252]">
                  Views
                </th>
                <th className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-[#525252]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#1A1A1A] transition-colors hover:bg-[#111111]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F5F5F5]">{p.title}</p>
                    <p className="font-mono text-xs text-[#525252]">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={p.is_published}
                      disabled={toggling === p.id}
                      onChange={() => togglePublish(p)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#A3A3A3]">
                    {p.view_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/blog/${p.id}/edit`}>
                        <button className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#1E1E1E] hover:text-[#F5F5F5]">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      {p.is_published && (
                        <Link href={`/blog/${p.slug}`} target="_blank">
                          <button className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#F9731615] hover:text-[#F97316]">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#EF444415] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[#525252]">
                    No posts found.{" "}
                    <Link href="/admin/blog/new" className="text-[#F97316] hover:underline">
                      Write your first post
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-[#525252]">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
