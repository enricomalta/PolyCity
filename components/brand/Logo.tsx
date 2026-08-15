import { cn } from "@/lib/utils"

// Textual PolyCity wordmark. A small stacked-block glyph reinforces the
// "city / low-poly" idea without a heavy SVG illustration.
export function Logo({ className, showMark = true }: { className?: string; showMark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold tracking-tight", className)}>
      {showMark && (
        <span aria-hidden className="relative inline-flex h-[1em] w-[1em] items-end justify-center gap-[0.08em]">
          <span className="h-[0.5em] w-[0.22em] rounded-[2px] bg-accent" />
          <span className="h-[0.85em] w-[0.22em] rounded-[2px] bg-primary" />
          <span className="h-[0.62em] w-[0.22em] rounded-[2px] bg-chart-3" />
        </span>
      )}
      <span>
        POLY<span className="text-primary">CITY</span>
      </span>
    </span>
  )
}
