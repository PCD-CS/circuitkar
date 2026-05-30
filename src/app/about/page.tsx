import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Circuitkar is an Indian electronics components store built for makers, students and small manufacturers.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
        Built for builders.
      </h1>
      <div className="mt-8 space-y-6 text-[#A3A3A3]">
        <p>
          Circuitkar is an Indian electronics components store made for the
          people who actually build things — hobbyists, engineering students,
          tinkerers and small manufacturers. We started with a simple
          frustration: sourcing reliable components in India is harder than it
          should be. Listings are messy, quality is inconsistent, and invoices
          for GST are an afterthought.
        </p>
        <p>
          We&apos;re fixing that with a tightly curated catalog of the parts
          makers reach for most — dev boards, sensors, displays, power modules,
          motor drivers and the prototyping essentials that hold a project
          together. No clutter, no thousand near-identical SKUs. Just the good
          stuff.
        </p>
        <p>
          Right now we&apos;re in pre-launch. Every product shows as out of
          stock and you can register interest with the{" "}
          <span className="text-[#F5F5F5]">Notify Me</span> button. That tells
          us exactly what to stock first — so the components you want are the
          ones we order. It&apos;s a community-first way to build a store.
        </p>
        <p>
          We operate out of Silvassa, are GST registered, and ship across
          India. When we go live, you&apos;ll get proper invoices, genuine
          components and fast dispatch.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/products">
          <Button>Browse Components</Button>
        </Link>
        <Link href="/contact">
          <Button variant="secondary">Get in Touch</Button>
        </Link>
      </div>
    </div>
  );
}
