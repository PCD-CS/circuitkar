"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploaderProps {
  productId: string;
  images: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUploader({ productId, images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string | null> {
    if (!ACCEPTED.includes(file.type)) {
      setError(`${file.name}: unsupported file type.`);
      return null;
    }
    if (file.size > MAX_BYTES) {
      setError(`${file.name}: exceeds 5MB.`);
      return null;
    }
    return new Promise((resolve) => {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", productId);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/upload/product-image");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            resolve(data.url as string);
          } else {
            setError(data.error || "Upload failed.");
            resolve(null);
          }
        } catch {
          setError("Upload failed.");
          resolve(null);
        }
      };
      xhr.onerror = () => {
        setError("Network error during upload.");
        resolve(null);
      };
      xhr.send(form);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      setProgress(0);
      const url = await uploadFile(file);
      if (url) uploaded.push(url);
    }
    if (uploaded.length) onChange([...images, ...uploaded]);
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function removeImage(url: string) {
    setDeleting(url);
    try {
      await fetch(
        `/api/admin/upload/product-image?url=${encodeURIComponent(url)}`,
        { method: "DELETE" },
      );
    } catch {
      // Even if storage delete fails, drop it from the list.
    }
    onChange(images.filter((u) => u !== url));
    setDeleting(null);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver
            ? "border-[#F97316] bg-[#F9731615]"
            : "border-[#262626] bg-[#111111] hover:border-[#525252]",
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
        ) : (
          <UploadCloud className="h-6 w-6 text-[#525252]" />
        )}
        <p className="text-sm text-[#A3A3A3]">
          Drag &amp; drop or{" "}
          <span className="text-[#F97316]">click to upload</span>
        </p>
        <p className="text-xs text-[#525252]">
          JPG, PNG or WebP — max 5MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && <ProgressBar value={progress} />}
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[#262626] bg-[#111111]"
            >
              <Image
                src={url}
                alt="Product image"
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                disabled={deleting === url}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-[#F5F5F5] transition-colors hover:bg-[#EF4444]"
              >
                {deleting === url ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
