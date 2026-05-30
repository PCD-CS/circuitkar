import { cn } from "@/lib/utils";

interface RichTextRendererProps {
  html: string;
  className?: string;
}

/**
 * Server-safe renderer for stored rich-text (Tiptap) HTML.
 * Styling is applied via the global `.rich-text` class (see globals.css).
 */
export function RichTextRenderer({ html, className }: RichTextRendererProps) {
  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
