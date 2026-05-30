"use client";

import { CheckCircle2, PartyPopper } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { InterestPostResponse } from "@/types";

interface NotifyMeModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess?: (newCount: number) => void;
}

export function NotifyMeModal({
  open,
  onClose,
  productId,
  productName,
  onSuccess,
}: NotifyMeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ position: number } | null>(null);

  function handleClose() {
    onClose();
    // reset after the close animation
    setTimeout(() => {
      setName("");
      setEmail("");
      setError(null);
      setDone(null);
      setLoading(false);
    }, 200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email, name: name || undefined }),
      });
      const data = (await res.json()) as InterestPostResponse | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "Something went wrong.");
        return;
      }
      setDone({ position: data.position });
      onSuccess?.(data.count);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={done ? undefined : "Notify Me"}>
      {done ? (
        <div className="flex flex-col items-center py-4 text-center animate-fade-in">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E15]">
            <PartyPopper className="h-7 w-7 text-[#22C55E]" />
          </div>
          <p className="text-lg font-bold text-[#F5F5F5]">
            You&apos;re #{done.position} on the list!
          </p>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            We&apos;ll email you the moment{" "}
            <span className="text-[#F5F5F5]">{productName}</span> is back in
            stock.
          </p>
          <Button onClick={handleClose} className="mt-6 w-full">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-[#A3A3A3]">
              Be the first to know when{" "}
              <span className="font-medium text-[#F5F5F5]">{productName}</span>{" "}
              is in stock.
            </p>
          </div>
          <Input
            name="name"
            label="Name (optional)"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            error={error || undefined}
          />
          <Button type="submit" loading={loading} className="w-full">
            <CheckCircle2 className="h-4 w-4" />
            Notify Me
          </Button>
        </form>
      )}
    </Modal>
  );
}
