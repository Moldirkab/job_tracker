import type { ApplicationStatus } from "../types/application";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; dot: string }> = {
  APPLIED: {
    label: "Applied",
    bg: "bg-status-applied-bg",
    text: "text-status-applied-text",
    dot: "bg-status-applied-dot",
  },
  INTERVIEW: {
    label: "Interview",
    bg: "bg-status-interview-bg",
    text: "text-status-interview-text",
    dot: "bg-status-interview-dot",
  },
  OFFER: {
    label: "Offer",
    bg: "bg-status-offer-bg",
    text: "text-status-offer-text",
    dot: "bg-status-offer-dot",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-status-rejected-bg",
    text: "text-status-rejected-text",
    dot: "bg-status-rejected-dot",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
