import { Badge as UiBadge } from "./ui";

function Badge({ text }) {
  return <UiBadge tone={getBadgeTone(text)}>{text}</UiBadge>;
}

function getBadgeTone(text = "") {
  const value = String(text).toLowerCase();
  if (value.includes("critical") || value.includes("high") || value.includes("เกิน")) return "rose";
  if (value.includes("medium") || value.includes("รอ") || value.includes("due")) return "amber";
  if (value.includes("low") || value.includes("closed") || value.includes("done") || value.includes("ปิด")) return "emerald";
  return "purple";
}

export default Badge;
