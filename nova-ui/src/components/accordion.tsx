import { useId, type DetailsHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { createContext, use } from "react";
import { cn } from "@/lib/cn";

const AccordionContext = createContext<{ name?: string }>({});

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * "single" uses the native `<details name>` grouping so the browser
   * guarantees only one item is open; "multiple" allows any number.
   */
  type?: "single" | "multiple";
}

/**
 * Built on <details>/<summary>: toggling, semantics and find-in-page
 * support are native. Open/close height animates to `auto` via
 * `interpolate-size` + `::details-content` (see nova.css) — zero JS.
 */
export function Accordion({ type = "single", className, children, ...props }: AccordionProps) {
  const groupName = useId();
  return (
    <AccordionContext value={{ name: type === "single" ? groupName : undefined }}>
      <div className={cn("divide-y rounded-nova-lg border bg-surface", className)} {...props}>
        {children}
      </div>
    </AccordionContext>
  );
}

export interface AccordionItemProps
  extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "title"> {
  title: ReactNode;
}

export function AccordionItem({ title, className, children, ...props }: AccordionItemProps) {
  const { name } = use(AccordionContext);

  return (
    <details name={name} className={cn("nova-details group", className)} {...props}>
      <summary
        className={cn(
          "flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-nova",
          "transition-colors hover:text-accent",
        )}
      >
        {title}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted transition-transform duration-200 ease-nova group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4 text-sm text-muted">{children}</div>
    </details>
  );
}
