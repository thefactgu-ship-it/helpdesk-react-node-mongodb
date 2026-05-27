import { Badge } from "./ui";

function StatusPill({ label, tone = "info" }) {
  const badgeTone = {
    danger: "rose",
    info: "purple",
    neutral: "neutral",
    warning: "amber",
  }[tone];

  return (
    <Badge className="max-w-full shrink-0 break-words" tone={badgeTone || "purple"}>
      {label}
    </Badge>
  );
}

export default StatusPill;
