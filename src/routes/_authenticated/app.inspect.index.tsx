import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSites } from "@/lib/use-me";
import { todayStr } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/app/inspect/")({ component: InspectSites });

function InspectSites() {
  const sites = useSites();
  const today = useQuery({
    queryKey: ["inspections", todayStr()],
    queryFn: async () => (await supabase.from("inspections").select("site_id, completed_at").eq("inspection_date", todayStr())).data ?? [],
  });
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold">ตรวจเช็คอุปกรณ์ประจำวัน</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}</p>
      </div>
      {(sites.data ?? []).filter((s) => s.active).map((s) => {
        const ins = today.data?.find((i) => i.site_id === s.id);
        const state = ins?.completed_at ? "done" : ins ? "doing" : "todo";
        return (
          <Link key={s.id} to="/app/inspect/$siteId" params={{ siteId: s.id }} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 font-display text-lg font-semibold text-primary">{s.code}</span>
            <div className="flex-1">
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.direction}</p>
            </div>
            {state === "done" ? <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-4" />ตรวจแล้ว</span>
              : state === "doing" ? <span className="flex items-center gap-1 text-xs text-warning-foreground"><Clock className="size-4" />กำลังตรวจ</span>
              : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Circle className="size-4" />ยังไม่ตรวจ</span>}
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
