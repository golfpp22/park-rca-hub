import { cn } from "@/lib/utils";
import { SEVERITY_LABEL, SEVERITY_TONE, STATUS_LABEL, STATUS_TONE } from "@/lib/labels";

type Sev = keyof typeof SEVERITY_LABEL;
type St = keyof typeof STATUS_LABEL;

export function SeverityBadge({ s }: { s: Sev }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", SEVERITY_TONE[s])}>{SEVERITY_LABEL[s]}</span>;
}
export function StatusBadge({ s }: { s: St }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_TONE[s])}>{STATUS_LABEL[s]}</span>;
}
