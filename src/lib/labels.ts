export type AppRole = "admin" | "executive" | "operator" | "technician";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "ผู้ดูแลระบบ (Admin)",
  executive: "ผู้บริหาร",
  operator: "หัวหน้า / Operator",
  technician: "ช่างเทคนิค",
};

export const SEVERITY_LABEL = { low: "ต่ำ", medium: "กลาง", high: "สูง", critical: "วิกฤต" } as const;
export const SEVERITY_TONE = {
  low: "bg-info/15 text-info",
  medium: "bg-warning/25 text-warning-foreground",
  high: "bg-destructive/15 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
} as const;

export const STATUS_LABEL = {
  open: "รอดำเนินการ",
  assigned: "มอบหมายแล้ว",
  in_progress: "กำลังดำเนินการ",
  waiting_parts: "รออะไหล่",
  resolved: "แก้ไขแล้ว",
  closed: "ปิดงาน",
} as const;
export const STATUS_TONE = {
  open: "bg-destructive/15 text-destructive",
  assigned: "bg-primary/15 text-primary",
  in_progress: "bg-warning/25 text-warning-foreground",
  waiting_parts: "bg-accent text-accent-foreground",
  resolved: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
} as const;

export const PROBLEM_TYPES = ["ไม่ขึ้นลง", "ขึ้นไม่สุด/ลงไม่สุด", "เสียงผิดปกติ", "ไม่อ่านป้ายทะเบียน", "เชื่อมต่อไม่ได้", "เครื่องไม่ตอบสนอง", "จ่ายบัตรไม่ได้", "ชำระเงินไม่ได้", "อื่นๆ"];

export const codeToEmail = (code: string) => `${code.trim().toLowerCase()}@parking.local`;

export const homeForRoles = (roles: AppRole[]) =>
  roles.includes("admin") ? "/admin" : roles.includes("executive") ? "/dashboard" : roles.includes("operator") ? "/incidents" : "/app";

export function minutesBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}
export function fmtDuration(min: number | null) {
  if (min == null) return "-";
  if (min < 60) return `${min} นาที`;
  return `${Math.floor(min / 60)} ชม. ${min % 60} นาที`;
}
export const fmtTime = (d?: string | null) => (d ? new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-");
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";
export const todayStr = () => new Date().toLocaleDateString("en-CA");
