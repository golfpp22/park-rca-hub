import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardCheck, TriangleAlert, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useSites } from "@/lib/use-me";
import { todayStr, fmtDateTime } from "@/lib/labels";
import { SeverityBadge, StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/_authenticated/app/")({ component: StaffHome });

function StaffHome() {
  const { user } = useMe();
  const sites = useSites();
  const today = useQuery({
    queryKey: ["inspections", todayStr()],
    queryFn: async () => (await supabase.from("inspections").select("site_id, completed_at").eq("inspection_date", todayStr())).data ?? [],
  });
  const jobs = useQuery({
    queryKey: ["myjobs", user.id],
    queryFn: async () =>
      (await supabase.from("incidents").select("id, code, title, severity, status, created_at, sites(name)").or(`assignee_id.eq.${user.id},status.eq.open`).not("status", "in", "(resolved,closed)").order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  const done = (today.data ?? []).filter((i) => i.completed_at).length;
  const total = sites.data?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-semibold">การตรวจเช็ควันนี้</p>
          <span className="text-sm text-muted-foreground">{done}/{total} จุด</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-success transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: "/app/inspect", label: "ตรวจเช็คอุปกรณ์", icon: ClipboardCheck, tone: "bg-primary/10 text-primary" },
          { to: "/app/report", label: "แจ้งปัญหา", icon: TriangleAlert, tone: "bg-destructive/10 text-destructive" },
          { to: "/app/jobs", label: "งานซ่อมของฉัน", icon: Wrench, tone: "bg-warning/25 text-warning-foreground" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center text-xs font-medium shadow-card">
            <span className={`grid size-11 place-items-center rounded-xl ${a.tone}`}><a.icon className="size-5" /></span>
            {a.label}
          </Link>
        ))}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold">งานที่ต้องดำเนินการ</p>
          <Link to="/app/jobs" className="text-sm text-primary">ดูทั้งหมด</Link>
        </div>
        <div className="space-y-2">
          {(jobs.data ?? []).length === 0 && <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">ไม่มีงานค้าง 🎉</p>}
          {(jobs.data ?? []).map((j) => (
            <Link key={j.id} to="/app/jobs/$id" params={{ id: j.id }} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">{j.code} · {j.sites?.name} · {fmtDateTime(j.created_at)}</div>
                <p className="truncate font-medium">{j.title}</p>
                <div className="mt-1 flex gap-1"><SeverityBadge s={j.severity} /><StatusBadge s={j.status} /></div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
