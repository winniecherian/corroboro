import type { SocialPlatform, Status } from "@/lib/types";

export function Seal({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 1.6l2.2 1.7 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8 1.7 2.2-1.7 2.2.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22.4l-2.2-1.7-2.8.3-1.1-2.6-2.6-1.1.3-2.8L1.9 12l1.7-2.2-.3-2.8 2.6-1.1L7 3.3l2.8.3z"
        fill="currentColor"
      />
      <path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statusColor: Record<Status, string> = {
  verified: "bg-seal",
  developing: "bg-amber",
  single: "bg-hush",
};

/**
 * The corroboration tally: one mark per independent news organisation.
 * At three marks the story earns the seal.
 */
export function Tally({
  count,
  status,
  size = "sm",
  animate = false,
}: {
  count: number;
  status: Status;
  size?: "sm" | "lg";
  animate?: boolean;
}) {
  const shown = Math.min(count, 10);
  const h = size === "lg" ? "h-9" : "h-5";
  const w = size === "lg" ? "w-[5px]" : "w-[3px]";
  const gap = size === "lg" ? "gap-[5px]" : "gap-[3px]";
  return (
    <span className={`inline-flex items-end ${gap} ${animate ? "tally-animate" : ""}`} aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className={`mark ${h} ${w} rounded-full ${statusColor[status]}`}
          style={animate ? { animationDelay: `${120 + i * 70}ms` } : undefined}
        />
      ))}
      {status === "verified" && (
        <span
          className={`seal text-seal ${size === "lg" ? "ml-2" : "ml-1"}`}
          style={animate ? { animationDelay: `${180 + shown * 70}ms` } : undefined}
        >
          <Seal size={size === "lg" ? 34 : 18} />
        </span>
      )}
    </span>
  );
}

export function statusText(status: Status, n: number) {
  if (status === "verified") return `Verified by ${n} independent outlets`;
  if (status === "developing") return "Reported by 2 outlets, awaiting a third";
  return "Single source, not yet confirmed";
}

export function StatusLabel({ status, count }: { status: Status; count: number }) {
  const cls =
    status === "verified"
      ? "bg-seal-tint text-seal"
      : status === "developing"
        ? "bg-amber-tint text-amber"
        : "bg-fog text-slate";
  const label = status === "verified" ? `Verified, ${count} outlets` : status === "developing" ? "2 outlets" : "1 outlet";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ${cls}`}>{label}</span>;
}

const platformMeta: Record<SocialPlatform, { label: string; glyph: string }> = {
  google: { label: "Google Trends", glyph: "G" },
  x: { label: "X", glyph: "𝕏" },
  reddit: { label: "Reddit", glyph: "r" },
  hackernews: { label: "Hacker News", glyph: "Y" },
};

export function PlatformGlyph({ platform, size = 22 }: { platform: SocialPlatform; size?: number }) {
  const m = platformMeta[platform];
  return (
    <span
      title={m.label}
      className="inline-grid shrink-0 place-items-center rounded-full border border-line bg-paper text-[11px] font-semibold text-slate"
      style={{ width: size, height: size }}
    >
      <span aria-hidden="true">{m.glyph}</span>
      <span className="sr-only">{m.label}</span>
    </span>
  );
}

export function platformName(p: SocialPlatform) {
  return platformMeta[p].label;
}
