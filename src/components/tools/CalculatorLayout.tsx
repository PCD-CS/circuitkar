import Link from "next/link";
import { ChevronRight, Wrench } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
}

export function CalculatorLayout({ title, description, icon, children }: Props) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-[#525252] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#A3A3A3]">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/tools" className="hover:text-[#A3A3A3]">Tools</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#A3A3A3]">{title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-xl">
              {icon}
            </div>
            <h1 className="text-2xl font-bold font-mono text-[#F5F5F5]">{title}</h1>
          </div>
          <p className="text-[#A3A3A3]">{description}</p>
        </div>

        {/* Calculator card */}
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-6 md:p-8">
          {children}
        </div>

        {/* Back to tools */}
        <div className="mt-6 text-center">
          <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#F97316] transition-colors">
            <Wrench className="h-3.5 w-3.5" /> All Calculators
          </Link>
        </div>
      </div>
    </div>
  );
}
