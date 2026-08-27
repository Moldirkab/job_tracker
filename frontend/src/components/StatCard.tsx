interface StatCardProps {
  label: string;
  value: number;
  accent?: "neutral" | "brand" | "interview" | "offer" | "rejected";
}

const ACCENT_MAP: Record<NonNullable<StatCardProps["accent"]>, string> = {
  neutral: "text-ink",
  brand: "text-brand-600",
  interview: "text-status-interview-text",
  offer: "text-status-offer-text",
  rejected: "text-status-rejected-text",
};

export default function StatCard({ label, value, accent = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-semibold ${ACCENT_MAP[accent]}`}>{value}</p>
    </div>
  );
}
