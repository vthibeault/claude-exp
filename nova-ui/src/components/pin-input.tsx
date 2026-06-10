import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface PinInputProps {
  length?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Called once all boxes are filled. */
  onComplete?: (value: string) => void;
  /** Restrict to digits (default) or allow alphanumerics. */
  type?: "numeric" | "alphanumeric";
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** OTP-style segmented input: auto-advance, backspace, arrows, paste. */
export function PinInput({
  length = 6,
  value,
  onValueChange,
  onComplete,
  type = "numeric",
  mask = false,
  disabled,
  autoFocus,
  className,
  "aria-label": ariaLabel = "PIN input",
}: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const pattern = type === "numeric" ? /^\d$/ : /^[a-zA-Z0-9]$/;

  const update = (next: string) => {
    onValueChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const setChar = (index: number, char: string) => {
    const chars = value.split("");
    chars[index] = char;
    update(chars.join("").slice(0, length));
    refs.current[Math.min(length - 1, index + 1)]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[index]) {
        chars[index] = "";
        update(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        update(chars.join(""));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    } else if (pattern.test(e.key)) {
      e.preventDefault();
      setChar(index, e.key);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const cleaner = type === "numeric" ? /\D/g : /[^a-zA-Z0-9]/g;
    const pasted = e.clipboardData.getData("text").replace(cleaner, "").slice(0, length);
    if (!pasted) return;
    update(pasted);
    refs.current[Math.min(length - 1, pasted.length)]?.focus();
  };

  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex gap-2", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={mask ? "password" : "text"}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={value[i] ?? ""}
          aria-label={`Character ${i + 1} of ${length}`}
          onChange={() => {}}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "size-10 rounded-nova border border-border-strong bg-surface text-center text-base font-medium shadow-nova-sm",
            "transition-[border-color,box-shadow] duration-150",
            "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value[i] && "border-accent",
          )}
        />
      ))}
    </div>
  );
}
