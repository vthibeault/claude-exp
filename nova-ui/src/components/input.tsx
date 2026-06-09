import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldClasses = [
  "w-full rounded-nova border border-border-strong bg-surface px-3 py-2 text-sm text-foreground shadow-nova-sm",
  "placeholder:text-subtle",
  "transition-[border-color,box-shadow] duration-150",
  "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/40",
];

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn("h-9", fieldClasses, className)} {...props} />;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn("min-h-20 field-sizing-content", fieldClasses, className)} {...props} />;
}
