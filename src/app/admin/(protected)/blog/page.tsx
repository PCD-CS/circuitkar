"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, ExternalLink, Search, X,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { BlogPost } from "@/types";

type SortField = "title" | "created_at" | "view_count" | "published_at";
type SortDir = "asc" | "desc";
const PAGE_SIZES = [10, 25, 50] as const;

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-[#F97316]" : "bg-[#262626]"}`}>
      <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 text-[#F97316]" />
    : <ChevronDown className="w-3.5 h-3.5 text-[#F97316]" />;
}

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [published, setPublished] = useState(""); // "" | "true" | "false"
  const [toggling, setToggling] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(total / pageSize) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDir,
    });
    if (search.trim()) qs.set("search", search.trim());
    if (published) qs.set("published", published);
    const res = await fetch(`/api/admin/blog?${qs}`);
    const data = await res.json();
    if (res.ok) {
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, search, sortBy, sortDir, published]);

  useEffect(() => { load(); }, [load]);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); setSearch(val); }, 350);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortDir("desc"); }
    setPage(1);
  }

  async function togglePublish(post: BlogPost) {
    setToggling(post.id);
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: !p.is_published } : p));
    } else { toast("Could not update.", "error"); }
    setToggling(null);
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Post deleted."); load(); }
    else { toast("Could not delete.", "error"); }
  }

  const SortableTh = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-mono text-[#525252] uppercase tracking-wider cursor-pointer select-none group ${className ?? "text-left"}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${className?.includes("right") ? "justify-end" : ""}`}>
        {label}<SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-mono text-xl font-bold text-[#F5F5F5]">Blog</h1>
          <p className="mt-0.5 text-sm text-[#525252]">{total} post{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm"><Plus className="h-4 w-4" /> New Post</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <input
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full rounded-lg border border-[#262626] bg-[#111111] py-2.5 pl-9 pr-9 text-sm text-[#F5F5F5] placeholder:text-[#525252] focus:border-[#F97316] focus:outline-none"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#A3A3A3]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={published} onChange={e => { setPublished(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#262626] bg-[#111111] px-3 py-2.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none">
          <option value="">All posts</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
        <div className="flex items-center gap-2 text-sm text-[#525252]">
          <span>Rows:</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value) as typeof PAGE_SIZES[number]); setPage(1); }}
            className="rounded-lg border border-[#262626] bg-[#111111] px-2 py-1.5 text-sm text-[#F5F5F5] focus:border-[#F97316] focus:outline-none">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#161616]" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#262626]">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#262626] bg-[#111111]">
                <SortableTh field="title" label="Title" />
                <th className="px-4 py-3 text-center text-xs font-mono text-[#525252] uppercase tracking-wider">Published</th>
                <SortableTh field="view_count" label="Views" className="text-right" />
                <SortableTh field="created_at" label="Date" className="text-right" />
                <th className="px-4 py-3 text-right text-xs font-mono text-[#525252] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#525252]">
                    No posts found.{" "}
                    {!search && !published && (
                      <Link href="/admin/blog/new" className="text-[#F97316] hover:underline">Write your first post</Link>
                    )}
                  </td>
                </tr>
              ) : posts.map(p => (
                <tr key={p.id} className="border-b border-[#1A1A1A] transition-colors hover:bg-[#111111]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F5F5F5]">{p.title}</p>
                    <p className="font-mono text-xs text-[#525252]">{p.slug}</p>
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded border border-[#262626] text-[#525252]">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={p.is_published} disabled={toggling === p.id} onChange={() => togglePublish(p)} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#A3A3A3]">{p.view_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-xs text-[#525252]">
                    {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/blog/${p.id}/edit`}>
                        <button className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#1E1E1E] hover:text-[#F5F5F5]" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      {p.is_published && (
                        <Link href={`/blog/${p.slug}`} target="_blank">
                          <button className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#F9731615] hover:text-[#F97316]" title="View live">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      )}
                      <button onClick={() => remove(p.id, p.title)}
                        className="rounded p-1.5 text-[#525252] transition-colors hover:bg-[#EF444415] hover:text-[#EF4444]" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-[#525252]">
            {total === 0 ? "No posts" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} posts`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return n <= totalPages ? (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-colors ${n === page ? "bg-[#F97316] text-white" : "text-[#A3A3A3] hover:bg-[#1E1E1E]"}`}>
                    {n}
                  </button>
                ) : null;
              })}
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
