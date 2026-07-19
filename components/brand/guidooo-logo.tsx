import { cn } from "@/lib/utils";

/**
 * Guidooo "Pin Trio" brand system — recreated from the official logo assets.
 * The wordmark is the word "Guid" followed by three location pins forming the
 * "ooo". Pins use the brand gradient trio (coral → orange → sunshine) and their
 * hole is punched with the surrounding surface color via the `holeColor` prop.
 */

const PIN_PATH =
  "M20 2 C31 2 38.5 10 38.5 20.5 C38.5 31 25 50 20 50 C15 50 1.5 31 1.5 20.5 C1.5 10 9 2 20 2 Z";

type PinProps = {
  color: string;
  holeColor: string;
  offset: string;
};

function Pin({ color, holeColor, offset }: PinProps) {
  return (
    <svg
      viewBox="0 0 40 52"
      className="inline-block h-[1.05em] w-auto shrink-0"
      style={{ transform: `translateY(${offset})` }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PIN_PATH} fill={color} />
      <ellipse cx="20" cy="19" rx="9.4" ry="9.8" fill={holeColor} />
    </svg>
  );
}

/** Standalone location-pin logomark (single pin), scales to font-size. */
export function GuidoooMark({
  className,
  color = "var(--color-brand-orange)",
  holeColor = "var(--color-background)",
}: {
  className?: string;
  color?: string;
  holeColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 52"
      className={cn("inline-block h-[1em] w-auto", className)}
      role="img"
      aria-label="Guidooo"
    >
      <path d={PIN_PATH} fill={color} />
      <ellipse cx="20" cy="19" rx="9.4" ry="9.8" fill={holeColor} />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  /** Color treatment for the "Guid" text. */
  tone?: "gradient" | "ink" | "light";
  /** Surface color punched through each pin hole (defaults to page bg). */
  holeColor?: string;
};

/** Full Guidooo wordmark: "Guid" + three location-pin o's. */
export function GuidoooWordmark({
  className,
  tone = "gradient",
  holeColor = "var(--color-background)",
}: WordmarkProps) {
  const textClass =
    tone === "gradient"
      ? "bg-gradient-to-r from-brand-coral via-brand-orange to-brand-sunshine bg-clip-text text-transparent"
      : tone === "light"
        ? "text-primary-foreground"
        : "text-brand-ink";

  return (
    <span
      className={cn(
        "inline-flex items-end font-heading font-extrabold leading-none tracking-tight",
        className,
      )}
    >
      <span className={cn("pr-[0.06em]", textClass)}>Guid</span>
      <span className="flex items-end gap-[0.03em] pb-[0.06em]">
        <Pin
          color="var(--color-brand-coral)"
          holeColor={holeColor}
          offset="-0.1em"
        />
        <Pin
          color="var(--color-brand-orange)"
          holeColor={holeColor}
          offset="0.06em"
        />
        <Pin
          color="var(--color-brand-sunshine)"
          holeColor={holeColor}
          offset="-0.03em"
        />
      </span>
    </span>
  );
}
