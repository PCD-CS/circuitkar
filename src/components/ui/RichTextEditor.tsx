"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Minus,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-[#F9731615] text-[#F97316]"
          : "text-[#A3A3A3] hover:bg-[#262626] hover:text-[#F5F5F5]",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#262626] bg-[#1E1E1E] p-2">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[#262626]" />
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[#262626]" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Ordered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[#262626]" />
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something…",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "rte-content min-h-[220px] w-full px-3 py-3 text-sm text-[#F5F5F5] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync when content is loaded asynchronously (e.g. edit page).
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[260px] rounded-lg border border-[#262626] bg-[#111111]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#262626] bg-[#111111]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .rte-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f5f5f5;
          margin: 0.75rem 0 0.5rem;
        }
        .rte-content h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #f5f5f5;
          margin: 0.75rem 0 0.5rem;
        }
        .rte-content p {
          color: #a3a3a3;
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .rte-content ul,
        .rte-content ol {
          color: #a3a3a3;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rte-content ul {
          list-style: disc;
        }
        .rte-content ol {
          list-style: decimal;
        }
        .rte-content pre {
          background: #1e1e1e;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 0.75rem;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.85rem;
          color: #f5f5f5;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .rte-content code {
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .rte-content hr {
          border: none;
          border-top: 1px solid #262626;
          margin: 1rem 0;
        }
        .rte-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #525252;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
