import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// CarouselItem
// ---------------------------------------------------------------------------

export interface CarouselItemProps {
  children: ReactNode;
  className?: string;
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <div
      className={cn(
        "snap-start shrink-0 w-full h-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel root
// ---------------------------------------------------------------------------

export interface CarouselProps {
  children: ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Carousel({
  children,
  autoPlay = false,
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
  loop = false,
  className,
  orientation = "horizontal",
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const childArray = Children.toArray(children);
  const count = childArray.length;
  const isHorizontal = orientation === "horizontal";

  // -----------------------------------------------------------------------
  // IntersectionObserver: track which slide is active
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Older browsers / non-DOM environments may not have IntersectionObserver.
    if (typeof IntersectionObserver === "undefined") return;
    const container = scrollRef.current;
    if (!container) return;

    const slides = Array.from(container.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = slides.indexOf(entry.target as HTMLElement);
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [count]);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const slide = container.children[index] as HTMLElement | undefined;
      if (!slide) return;

      if (isHorizontal) {
        container.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
      } else {
        container.scrollTo({ top: slide.offsetTop, behavior: "smooth" });
      }
    },
    [isHorizontal],
  );

  const next = useCallback(() => {
    if (activeIndex < count - 1) {
      scrollToIndex(activeIndex + 1);
    } else if (loop) {
      scrollToIndex(0);
    }
  }, [activeIndex, count, loop, scrollToIndex]);

  const prev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    } else if (loop) {
      scrollToIndex(count - 1);
    }
  }, [activeIndex, count, loop, scrollToIndex]);

  // -----------------------------------------------------------------------
  // AutoPlay
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!autoPlay || isHovered) return;

    autoPlayRef.current = setInterval(next, autoPlayInterval);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, autoPlayInterval, isHovered, next]);

  // -----------------------------------------------------------------------
  // Scroll end → loop wrap
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!loop) return;
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isHorizontal) {
        const atEnd =
          container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
        if (atEnd && activeIndex === count - 1) {
          // Wrap: jump to start without animation
          container.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
        }
      } else {
        const atEnd =
          container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
        if (atEnd && activeIndex === count - 1) {
          container.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [loop, isHorizontal, activeIndex, count]);

  const canGoPrev = loop || activeIndex > 0;
  const canGoNext = loop || activeIndex < count - 1;

  return (
    <div
      className={cn("relative overflow-hidden rounded-nova-lg", className)}
      onPointerEnter={(e) => { if (e.pointerType !== "touch") setIsHovered(true); }}
      onPointerLeave={(e) => { if (e.pointerType !== "touch") setIsHovered(false); }}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Scroll track */}
      <div
        ref={scrollRef}
        className={cn(
          "flex",
          isHorizontal ? "overflow-x-auto snap-x" : "flex-col overflow-y-auto snap-y",
          "snap-mandatory scroll-smooth",
          // Hide scrollbar
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        style={{ scrollSnapType: isHorizontal ? "x mandatory" : "y mandatory" }}
      >
        {childArray}
      </div>

      {/* Previous arrow */}
      {showArrows && canGoPrev && (
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prev}
          className={cn(
            "absolute z-10 flex items-center justify-center size-8 rounded-full",
            "bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/20 transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isHorizontal
              ? "left-2 top-1/2 -translate-y-1/2"
              : "top-2 left-1/2 -translate-x-1/2",
          )}
        >
          {isHorizontal ? (
            <ChevronLeft className="size-4 text-white" />
          ) : (
            <ChevronUp className="size-4 text-white" />
          )}
        </button>
      )}

      {/* Next arrow */}
      {showArrows && canGoNext && (
        <button
          type="button"
          aria-label="Next slide"
          onClick={next}
          className={cn(
            "absolute z-10 flex items-center justify-center size-8 rounded-full",
            "bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/20 transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isHorizontal
              ? "right-2 top-1/2 -translate-y-1/2"
              : "bottom-2 left-1/2 -translate-x-1/2",
          )}
        >
          {isHorizontal ? (
            <ChevronRight className="size-4 text-white" />
          ) : (
            <ChevronDown className="size-4 text-white" />
          )}
        </button>
      )}

      {/* Dot indicators */}
      {showDots && count > 1 && (
        <div
          className={cn(
            "absolute z-10 flex gap-1.5",
            isHorizontal
              ? "bottom-2 left-1/2 -translate-x-1/2"
              : "right-2 top-1/2 -translate-y-1/2 flex-col",
          )}
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "rounded-full transition-all duration-300 outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                i === activeIndex
                  ? isHorizontal
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-4 bg-white"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/75",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
