import {
  cloneElement,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Label } from "./label";

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** A single form control; Field wires id, aria-describedby and aria-invalid onto it. */
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Accessible form field wrapper: generates ids and connects label,
 * description and error message to the control automatically.
 */
export function Field({ label, description, error, required, children, className, ...props }: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const describedBy =
    [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {control}
      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
