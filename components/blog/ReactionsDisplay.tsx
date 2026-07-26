type ReactionsDisplayProps = {
  likeCount: number | null | undefined;
  dislikeCount: number | null | undefined;
  likeLabel: string;
  dislikeLabel: string;
  locale: string;
  size?: "sm" | "md";
  className?: string;
};

const chipBase =
  "pointer-events-none select-none inline-flex flex-1 min-w-[6rem] items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-surface-2/80 font-semibold text-text shadow-inner";
const iconBubble = "flex h-7 w-7 items-center justify-center rounded-full bg-surface text-base";

export function ReactionsDisplay({
  likeCount,
  dislikeCount,
  likeLabel,
  dislikeLabel,
  locale,
  size = "md",
  className,
}: ReactionsDisplayProps) {
  const formatter = new Intl.NumberFormat(locale);
  const resolvedLike = formatter.format(likeCount ?? 0);
  const resolvedDislike = formatter.format(dislikeCount ?? 0);
  const sizing = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const containerClasses = ["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ");

  return (
    <div className={containerClasses}>
      <span className={`${chipBase} ${sizing}`} aria-label={`${likeLabel}: ${resolvedLike}`}>
        <span className="flex items-center gap-2 text-muted">
          <span className={iconBubble} aria-hidden="true">
            👍
          </span>
          <span className="font-medium text-text">{likeLabel}</span>
        </span>
        <span className="text-primary">{resolvedLike}</span>
      </span>
      <span className={`${chipBase} ${sizing}`} aria-label={`${dislikeLabel}: ${resolvedDislike}`}>
        <span className="flex items-center gap-2 text-muted">
          <span className={iconBubble} aria-hidden="true">
            👎
          </span>
          <span className="font-medium text-text">{dislikeLabel}</span>
        </span>
        <span className="text-primary">{resolvedDislike}</span>
      </span>
    </div>
  );
}
