import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page, Panel, Stat } from "@/components/page";
import { PhotoGrid } from "@/components/photos";
import { Input } from "@/components/ui/input";
import { fmtTime, todayStr } from "@/lib/labels";
import { useStaffList } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/inspections")({
  head: () => ({ meta: [{ title: "รายงานตรวจเช็คประจำวัน — Go Inno Parking Ops" }, { name: "description", content: "ผลการตรวจเช็คอุปกรณ์ประจำวันของพนักงาน" }] }),
  component: Inspections,
});

function Inspections() {
  const [date, setDate] = useState(todayStr());
  const staff = useStaffList();
  const q = useQuery({
    queryKey: ["ins-report", date],
    queryFn: async () => {
      const [{ data: sites }, { data: ins }] = await Promise.all([
        supabase.from("sites").select("*").order("code"),
        supabase.from("inspections").select("*, inspection_results(*, equipment(name))").eq("inspection_date", date),
      ]);
      return { sites: sites ?? [], ins: ins ?? [] };
    },
  });
  const name = (id: string) => staff.data?.find((s) => s.id === id)?.full_name ?? "-";
  const sites = q.data?.sites ?? [];
  const ins = q.data?.ins ?? [];
  const results = ins.flatMap((i) => i.inspection_results);
  return (
    <Page title="รายงานตรวจเช็คประจำวัน" subtitle="ผู้บริหารตรวจสอบการตรวจเช็คของพนักงานได้ที่นี่" actions={<Input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="w-44" />}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="จุดที่ตรวจเสร็จ" value={`${ins.filter((i) => i.completed_at).length}/${sites.length}`} />
        <Stat label="อุปกรณ์ที่ตรวจ" value={results.length} />
        <Stat label="ปกติ" value={results.filter((r) => r.status === "ok").length} tone="text-success" />
        <Stat label="พบปัญหา" value={results.filter((r) => r.status === "problem").length} tone="text-destructive" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sites.map((s) => {
          const i = ins.find((x) => x.site_id === s.id);
          return (
            <Panel key={s.id} title={`${s.name} · ${s.direction}`} action={<span className="text-xs text-muted-foreground">{i ? `${name(i.inspector_id)} · ${i.completed_at ? `ส่งเมื่อ ${fmtTime(i.completed_at)}` : "กำลังตรวจ"}` : "ยังไม่ตรวจ"}</span>}>
              {!i?.inspection_results.length ? <p className="text-sm text-muted-foreground">ยังไม่มีผลการตรวจ</p> : (
                <ul className="divide-y text-sm">
                  {i.inspection_results.map((r) => (
                    <li key={r.id} className="py-2">
                      <div className="flex items-center justify-between">
                        <span>{r.equipment?.name}</span>
                        <span className={r.status === "ok" ? "text-success" : r.status === "problem" ? "text-destructive" : "text-warning"}>{r.status === "ok" ? "ปกติ" : r.status === "problem" ? `พบปัญหา: ${r.problem_type}` : "หมายเหตุ"}</span>
                      </div>
                      {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                      {r.photos.length > 0 && <div className="mt-2"><PhotoGrid paths={r.photos} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}
