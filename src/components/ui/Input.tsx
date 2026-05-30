import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldClasses =
  "w-full rounded-lg bg-[#111111] border border-[#262626] px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#525252] transition-colors focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[#A3A3A3]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldClasses, error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]", className)}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-[#EF4444]">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-[#525252]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[#A3A3A3]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldClasses, "min-h-[100px] resize-y", error && "border-[#EF4444]", className)}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-[#EF4444]">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-[#525252]">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
