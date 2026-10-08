import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { fmtDateTime } from "@/lib/labels";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/jobs/")({ component: Jobs });

function Jobs() {
  const { user } = useMe();
  const [tab, setTab] = useState<"mine" | "open" | "done">("mine");
  const q = useQuery({
    queryKey: ["jobs", tab, user.id],
    queryFn: async () => {
      let s = supabase.from("incidents").select("id, code, title, severity, status, created_at, sites(name)").order("created_at", { ascending: false }).limit(50);
      if (tab === "mine") s = s.eq("assignee_id", user.id).not("status", "in", "(resolved,closed)");
      if (tab === "open") s = s.eq("status", "open");
      if (tab === "done") s = s.or(`assignee_id.eq.${user.id},reporter_id.eq.${user.id}`).in("status", ["resolved", "closed"]);
      return (await s).data ?? [];
    },
  });
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold">งานซ่อม</h1>
      <div className="grid grid-cols-3 rounded-lg bg-muted p-1 text-sm">
        {([["mine", "งานของฉัน"], ["open", "งานรอรับ"], ["done", "เสร็จแล้ว"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={cn("rounded-md py-1.5", tab === v && "bg-card font-medium shadow-card")}>{l}</button>
        ))}
      </div>
      {(q.data ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">ไม่มีรายการ</p>}
      {(q.data ?? []).map((j) => (
        <Link key={j.id} to="/app/jobs/$id" params={{ id: j.id }} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{j.code} · {j.sites?.name} · {fmtDateTime(j.created_at)}</p>
            <p className="truncate font-medium">{j.title}</p>
            <div className="mt-1 flex gap-1"><SeverityBadge s={j.severity} /><StatusBadge s={j.status} /></div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
