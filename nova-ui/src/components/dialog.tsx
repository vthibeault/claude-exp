import {
  createContext,
  use,
  useEffect,
  useRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

interface DialogContextValue {
  close: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visual style: centered modal (default) or edge-docked sheet. */
  variant?: "modal" | "sheet";
  children: ReactNode;
}

/**
 * Built on the native <dialog> element: top layer, focus trapping, inert
 * background, and Esc handling come from the platform. Entry/exit
 * animations are pure CSS via @starting-style (see nova.css).
 */
export function Dialog({
  open,
  onOpenChange,
  variant = "modal",
  className,
  children,
  ...props
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Feature-detect for environments without full <dialog> support (e.g. jsdom).
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    // Clicks on ::backdrop land on the <dialog> element itself.
    if (e.target === ref.current) onOpenChange(false);
  };

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={handleBackdropClick}
      className={cn(
        "m-auto w-full bg-surface text-foreground shadow-nova-lg backdrop:bg-transparent",
        variant === "modal" && "nova-dialog max-w-md rounded-nova-lg border p-6",
        variant === "sheet" &&
          "nova-sheet mr-0 h-dvh max-h-dvh max-w-sm border-l p-6",
        className,
      )}
      {...props}
    >
      <DialogContext value={{ close: () => onOpenChange(false) }}>
        {/* Inner wrapper so backdrop-click detection isn't fooled by padding. */}
        <div className="contents">{children}</div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3.5 top-3.5 text-muted"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X />
        </Button>
      </DialogContext>
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />;
}

/** Closes the nearest Dialog when its child is clicked. */
export function DialogClose({ children }: { children: ReactNode }) {
  const ctx = use(DialogContext);
  return <span onClick={() => ctx?.close()}>{children}</span>;
}
