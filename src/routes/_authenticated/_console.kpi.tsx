import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Page, Panel } from "@/components/page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL, fmtDuration, minutesBetween } from "@/lib/labels";
import { useStaffList } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/kpi")({
  head: () => ({ meta: [{ title: "KPI พนักงาน — Go Inno Parking Ops" }, { name: "description", content: "ผลการทำงานของพนักงานแต่ละคน" }] }),
  component: Kpi,
});

function Kpi() {
  const [days, setDays] = useState("30");
  const staff = useStaffList();
  const q = useQuery({
    queryKey: ["kpi", days],
    queryFn: async () => {
      const since = new Date(Date.now() - Number(days) * 864e5).toISOString();
      const [{ data: inc }, { data: ins }] = await Promise.all([
        supabase.from("incidents").select("assignee_id, reporter_id, status, severity, created_at, started_at, resolved_at").gte("created_at", since),
        supabase.from("inspections").select("inspector_id, completed_at").gte("created_at", since),
      ]);
      return { inc: inc ?? [], ins: ins ?? [] };
    },
  });
  const rows = (staff.data ?? []).filter((s) => s.active).map((s) => {
    const mine = (q.data?.inc ?? []).filter((i) => i.assignee_id === s.id);
    const done = mine.filter((i) => i.resolved_at);
    const avg = done.length ? Math.round(done.reduce((a, i) => a + (minutesBetween(i.created_at, i.resolved_at) ?? 0), 0) / done.length) : null;
    const resp = mine.filter((i) => i.started_at);
    const avgResp = resp.length ? Math.round(resp.reduce((a, i) => a + (minutesBetween(i.created_at, i.started_at) ?? 0), 0) / resp.length) : null;
    const within = done.filter((i) => (minutesBetween(i.created_at, i.resolved_at) ?? 9999) <= (i.severity === "critical" ? 60 : i.severity === "high" ? 120 : 240)).length;
    const inspections = (q.data?.ins ?? []).filter((i) => i.inspector_id === s.id && i.completed_at).length;
    const reported = (q.data?.inc ?? []).filter((i) => i.reporter_id === s.id).length;
    return { ...s, assigned: mine.length, done: done.length, avg, avgResp, sla: done.length ? Math.round((within / done.length) * 100) : null, inspections, reported };
  });
  return (
    <Page title="KPI พนักงาน" subtitle="งานที่รับผิดชอบ เวลาตอบสนอง เวลาแก้ไข และการตรวจเช็ค (SLA: วิกฤต ≤1 ชม., สูง ≤2 ชม., อื่นๆ ≤4 ชม.)" actions={
      <Select value={days} onValueChange={setDays}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 วันล่าสุด</SelectItem><SelectItem value="30">30 วันล่าสุด</SelectItem><SelectItem value="90">90 วันล่าสุด</SelectItem></SelectContent></Select>
    }>
      <Panel title="งานซ่อมต่อพนักงาน">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows.map((r) => ({ name: r.employee_code, รับผิดชอบ: r.assigned, เสร็จ: r.done, ตรวจเช็ค: r.inspections }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend />
            <Bar dataKey="รับผิดชอบ" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /><Bar dataKey="เสร็จ" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /><Bar dataKey="ตรวจเช็ค" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">พนักงาน</th><th>ตำแหน่ง</th><th className="text-center">งานที่รับ</th><th className="text-center">เสร็จ</th><th className="text-center">ตอบสนองเฉลี่ย</th><th className="text-center">แก้ไขเฉลี่ย</th><th className="text-center">ตาม SLA</th><th className="text-center">ตรวจเช็ค (จุด)</th><th className="text-center">แจ้งปัญหา</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><p className="font-medium">{r.full_name}</p><p className="text-xs text-muted-foreground">{r.employee_code}</p></td>
                <td className="text-xs">{r.roles.map((x) => ROLE_LABEL[x]).join(", ")}</td>
                <td className="text-center">{r.assigned}</td>
                <td className="text-center">{r.done}</td>
                <td className="text-center">{fmtDuration(r.avgResp)}</td>
                <td className="text-center">{fmtDuration(r.avg)}</td>
                <td className="text-center">{r.sla == null ? "-" : <span className={r.sla >= 80 ? "font-semibold text-success" : "font-semibold text-destructive"}>{r.sla}%</span>}</td>
                <td className="text-center">{r.inspections}</td>
                <td className="text-center">{r.reported}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
