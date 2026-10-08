import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { todayStr } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/inspect/$siteId/")({ component: SiteInspect });

export function useTodayInspection(siteId: string) {
  const { user } = useMe();
  return useQuery({
    queryKey: ["inspection", siteId, todayStr()],
    queryFn: async () => {
      const { data } = await supabase.from("inspections").select("*").eq("site_id", siteId).eq("inspection_date", todayStr()).maybeSingle();
      if (data) return data;
      const { data: created, error } = await supabase.from("inspections").insert({ site_id: siteId, inspector_id: user.id, inspection_date: todayStr() }).select().single();
      if (error) {
        const { data: again } = await supabase.from("inspections").select("*").eq("site_id", siteId).eq("inspection_date", todayStr()).maybeSingle();
        return again;
      }
      return created;
    },
  });
}

function SiteInspect() {
  const { siteId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ins = useTodayInspection(siteId);
  const data = useQuery({
    queryKey: ["site-eq", siteId],
    queryFn: async () => {
      const [{ data: site }, { data: eq }] = await Promise.all([
        supabase.from("sites").select("*").eq("id", siteId).single(),
        supabase.from("equipment").select("*").eq("site_id", siteId).order("sort_order"),
      ]);
      return { site, eq: eq ?? [] };
    },
  });
  const results = useQuery({
    queryKey: ["results", ins.data?.id],
    enabled: !!ins.data?.id,
    queryFn: async () => (await supabase.from("inspection_results").select("equipment_id, status").eq("inspection_id", ins.data!.id)).data ?? [],
  });
  useEffect(() => { qc.invalidateQueries({ queryKey: ["inspections"] }); }, [ins.data?.id, qc]);

  const eq = data.data?.eq ?? [];
  const checked = results.data ?? [];
  const allDone = eq.length > 0 && eq.every((e) => checked.some((c) => c.equipment_id === e.id));

  async function finish() {
    await supabase.from("inspections").update({ completed_at: new Date().toISOString() }).eq("id", ins.data!.id);
    qc.invalidateQueries({ queryKey: ["inspections"] });
    toast.success("บันทึกการตรวจเช็คเรียบร้อย");
    navigate({ to: "/app/inspect" });
  }

  return (
    <div className="space-y-3">
      <Link to="/app/inspect" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" />กลับ</Link>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-bold">{data.data?.site?.name} · {data.data?.site?.direction}</h1>
          <p className="text-sm text-muted-foreground">ตรวจแล้ว {checked.length}/{eq.length} รายการ</p>
        </div>
      </div>
      {eq.map((e) => {
        const r = checked.find((c) => c.equipment_id === e.id);
        return (
          <Link key={e.id} to="/app/inspect/$siteId/$equipmentId" params={{ siteId, equipmentId: e.id }} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
            {r?.status === "problem" ? <TriangleAlert className="size-5 text-destructive" /> : r ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground" />}
            <div className="flex-1">
              <p className="font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.asset_code}</p>
            </div>
            <span className="text-xs text-muted-foreground">{r ? (r.status === "problem" ? "พบปัญหา" : r.status === "note" ? "หมายเหตุ" : "ปกติ") : "ยังไม่ตรวจ"}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        );
      })}
      <Button className="h-12 w-full" disabled={!allDone || !!ins.data?.completed_at} onClick={finish}>
        {ins.data?.completed_at ? "ส่งรายงานแล้ว" : "ส่งรายงานการตรวจเช็ค"}
      </Button>
    </div>
  );
}
