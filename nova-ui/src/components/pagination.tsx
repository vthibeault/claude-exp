import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Sibling pages shown on each side of the current page. */
  siblings?: number;
  className?: string;
}

function pageRange(page: number, pageCount: number, siblings: number): Array<number | "…"> {
  const total = siblings * 2 + 5; // first + last + current + siblings + 2 ellipses
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const left = Math.max(2, page - siblings);
  const right = Math.min(pageCount - 1, page + siblings);
  const range: Array<number | "…"> = [1];
  if (left > 2) range.push("…");
  for (let p = left; p <= right; p++) range.push(p);
  if (right < pageCount - 1) range.push("…");
  range.push(pageCount);
  return range;
}

export function Pagination({ page, pageCount, onPageChange, siblings = 1, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>

      {pageRange(page, pageCount, siblings).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-sm text-subtle">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "soft" : "ghost"}
            size="icon-sm"
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className="tabular-nums"
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
