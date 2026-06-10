import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

// ---------------------------------------------------------------------------
// Alert — inline banner
// ---------------------------------------------------------------------------

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, { border: string; bg: string; fg: string; iconFg: string }> = {
  info: {
    border: "border-l-[oklch(54%_0.23_277)]",
    bg: "bg-accent-soft",
    fg: "text-accent-soft-foreground",
    iconFg: "text-accent",
  },
  success: {
    border: "border-l-[oklch(62%_0.17_152)]",
    bg: "bg-success-soft",
    fg: "text-success-soft-foreground",
    iconFg: "text-success",
  },
  warning: {
    border: "border-l-[oklch(76%_0.16_75)]",
    bg: "bg-warning-soft",
    fg: "text-warning-soft-foreground",
    iconFg: "text-warning",
  },
  danger: {
    border: "border-l-[oklch(58%_0.21_25)]",
    bg: "bg-danger-soft",
    fg: "text-danger-soft-foreground",
    iconFg: "text-danger",
  },
};

const DEFAULT_ICONS: Record<AlertVariant, ReactNode> = {
  info: <Info className="size-4 shrink-0" />,
  success: <CheckCircle2 className="size-4 shrink-0" />,
  warning: <AlertTriangle className="size-4 shrink-0" />,
  danger: <XCircle className="size-4 shrink-0" />,
};

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className,
}: AlertProps) {
  const styles = VARIANT_STYLES[variant];
  const resolvedIcon = icon !== undefined ? icon : DEFAULT_ICONS[variant];
  // info and success are non-urgent; danger/warning are assertive
  const role = variant === "info" || variant === "success" ? "status" : "alert";

  return (
    <div
      role={role}
      className={cn(
        "relative flex gap-3 rounded-nova border border-l-4 p-4 text-sm",
        styles.border,
        styles.bg,
        styles.fg,
        className,
      )}
    >
      {resolvedIcon && (
        <span className={cn("mt-0.5", styles.iconFg)}>{resolvedIcon}</span>
      )}
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold leading-none">{title}</p>}
        <div className="leading-snug">{children}</div>
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("absolute right-2 top-2 -mr-1 -mt-1 opacity-70 hover:opacity-100", styles.fg)}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertDialog — confirmation dialog (native <dialog>, no backdrop dismiss)
// ---------------------------------------------------------------------------

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  children?: never;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: AlertDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      aria-labelledby="alert-dialog-title"
      aria-describedby={description ? "alert-dialog-desc" : undefined}
      className={cn(
        "nova-dialog m-auto w-full max-w-sm rounded-nova-lg border bg-surface p-6 text-foreground shadow-nova-lg backdrop:bg-transparent",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 id="alert-dialog-title" className="text-base font-semibold leading-none tracking-tight">
            {title}
          </h2>
          {description && (
            <p id="alert-dialog-desc" className="text-sm text-muted">
              {description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "primary"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
