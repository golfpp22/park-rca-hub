import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Page, Panel, Stat } from "@/components/page";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { Input } from "@/components/ui/input";
import { TrafficHeatmap } from "@/components/traffic-heatmap";
import { fmtDuration, fmtTime, minutesBetween, todayStr } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/_console/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard ผู้บริหาร — Go Inno Parking Ops" }, { name: "description", content: "ภาพรวมรายได้ ปริมาณรถ Heatmap รายชั่วโมงแยกจุดเข้า-ออก และสถานะอุปกรณ์" }, { property: "og:title", content: "Dashboard ผู้บริหาร — Go Inno Parking Ops" }, { property: "og:description", content: "ติดตามปริมาณรถรายจุดและรายชั่วโมง รายได้ และสถานะงานซ่อมลานจอดรถ" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tt = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" } };
const baht = (n: number) => `฿${Math.round(n).toLocaleString()}`;

function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const q = useQuery({
    queryKey: ["dash", date],
    queryFn: async () => {
      const d = new Date(date);
      const from = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-CA");
      const from30 = new Date(d.getTime() - 29 * 864e5).toLocaleDateString("en-CA");
      const [hourly, sites, eq, incidents, month, trend, ins] = await Promise.all([
        supabase.from("parking_hourly").select("*").eq("stat_date", date),
        supabase.from("sites").select("*").order("code"),
        supabase.from("equipment").select("id, site_id, type, status"),
        supabase.from("incidents").select("id, code, title, severity, status, created_at, resolved_at, site_id, sites(name)").order("created_at", { ascending: false }).limit(500),
        supabase.rpc("daily_totals", { _from: from, _to: date }),
        supabase.rpc("daily_totals", { _from: from30, _to: date }),
        supabase.from("inspections").select("site_id, completed_at").eq("inspection_date", date),
      ]);
      return { hourly: hourly.data ?? [], sites: sites.data ?? [], eq: eq.data ?? [], incidents: incidents.data ?? [], month: month.data ?? [], trend: trend.data ?? [], ins: ins.data ?? [] };
    },
  });
  const d = q.data;
  if (!d) return <Page title="Dashboard ผู้บริหาร"><p className="text-muted-foreground">กำลังโหลด...</p></Page>;

  const sum = (k: "entries" | "exits" | "revenue" | "pay_qr" | "pay_kiosk" | "pay_exit") => d.hourly.reduce((a, r) => a + Number(r[k]), 0);
  const entries = sum("entries"), exits = sum("exits"), revenue = sum("revenue");
  const monthRev = d.month.reduce((a, r) => a + Number(r.revenue), 0);
  const hours = Array.from({ length: 24 }, (_, h) => {
    const rows = d.hourly.filter((r) => r.hour === h);
    return { h: `${String(h).padStart(2, "0")}:00`, เข้า: rows.reduce((a, r) => a + r.entries, 0), ออก: rows.reduce((a, r) => a + r.exits, 0), รายได้: rows.reduce((a, r) => a + Number(r.revenue), 0) };
  });
  const perSite = d.sites.map((s) => {
    const rows = d.hourly.filter((r) => r.site_id === s.id);
    return { name: s.name, รายได้: rows.reduce((a, r) => a + Number(r.revenue), 0), รถ: rows.reduce((a, r) => a + r.entries, 0) };
  });
  const pay = [{ name: "QR Payment", value: sum("pay_qr") }, { name: "Kiosk ชำระเงิน", value: sum("pay_kiosk") }, { name: "ชำระที่ทางออก", value: sum("pay_exit") }];
  const online = d.eq.filter((e) => e.status === "online").length;
  const openInc = d.incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const resolved = d.incidents.filter((i) => i.resolved_at);
  const avgFix = resolved.length ? Math.round(resolved.reduce((a, i) => a + (minutesBetween(i.created_at, i.resolved_at) ?? 0), 0) / resolved.length) : null;
  const sevCount = (["critical", "high", "medium", "low"] as const).map((s, i) => ({ name: { critical: "วิกฤต", high: "สูง", medium: "กลาง", low: "ต่ำ" }[s], value: d.incidents.filter((x) => x.severity === s).length, fill: C[[3, 2, 0, 4][i] ?? 0] }));
  const insDone = d.ins.filter((i) => i.completed_at).length;
  const types = ["lpr", "barrier", "loop", "kiosk", "intercom", "cctv", "network", "power"];

  return (
    <Page title="Dashboard ผู้บริหาร" subtitle="ภาพรวมระบบลานจอดรถและการแก้ไขปัญหา" actions={<Input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="w-44" />}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="รายได้วันนี้" value={baht(revenue)} tone="text-success" />
        <Stat label="รายได้เดือนนี้" value={baht(monthRev)} />
        <Stat label="รถเข้า" value={entries.toLocaleString()} sub="คัน" />
        <Stat label="รถออก" value={exits.toLocaleString()} sub="คัน" />
        <Stat label="อุปกรณ์ออนไลน์" value={`${online}/${d.eq.length}`} tone={online === d.eq.length ? "text-success" : "text-warning"} />
        <Stat label="ปัญหาค้าง" value={openInc.length} tone="text-destructive" sub={`เวลาแก้ไขเฉลี่ย ${fmtDuration(avgFix)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="ปริมาณรถเข้า-ออก รายชั่วโมง" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={11} interval={2} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tt} /><Legend />
              <Area dataKey="เข้า" stroke={C[0]} fill={C[0]} fillOpacity={0.25} />
              <Area dataKey="ออก" stroke={C[1]} fill={C[1]} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="ช่องทางการชำระเงิน">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pay} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {pay.map((_, i) => <Cell key={i} fill={C[i]} />)}
              </Pie>
              <Tooltip {...tt} formatter={(v: number) => baht(v)} /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <TrafficHeatmap sites={d.sites} rows={d.hourly} date={date} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="แนวโน้มรายได้ 30 วัน" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={d.trend.map((r) => ({ d: new Date(r.stat_date).getDate(), รายได้: Number(r.revenue), รถ: Number(r.entries) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tt} />
              <Line dataKey="รายได้" stroke={C[1]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="รายได้แยกตามจุด (วันนี้)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perSite} layout="vertical">
              <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={50} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tt} formatter={(v: number) => baht(v)} />
              <Bar dataKey="รายได้" fill={C[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="สถานะอุปกรณ์แต่ละจุด" action={<span className="text-xs text-muted-foreground">ตรวจเช็ควันนี้ {insDone}/{d.sites.length} จุด</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">จุด</th>{["LPR", "Barrier", "Loop", "Kiosk", "Intercom", "CCTV", "Network", "Power"].map((t) => <th key={t} className="text-center">{t}</th>)}<th className="text-center">ตรวจเช็ค</th></tr></thead>
            <tbody>
              {d.sites.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2.5 font-medium">{s.name} <span className="text-xs text-muted-foreground">{s.direction}</span></td>
                  {types.map((t) => {
                    const e = d.eq.find((x) => x.site_id === s.id && x.type === t);
                    return <td key={t} className="text-center"><span className={`inline-block size-3 rounded-full ${!e ? "bg-muted" : e.status === "online" ? "bg-success" : "bg-destructive"}`} /></td>;
                  })}
                  <td className="text-center text-xs">{d.ins.find((i) => i.site_id === s.id)?.completed_at ? "✓" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="ปัญหาตามระดับความรุนแรง">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevCount}><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tt} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{sevCount.map((s, i) => <Cell key={i} fill={s.fill} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="ปัญหาล่าสุด" className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">เวลา</th><th>จุด</th><th>ปัญหา</th><th>ระดับ</th><th>สถานะ</th></tr></thead>
            <tbody>
              {d.incidents.slice(0, 7).map((i) => (
                <tr key={i.id} className="border-t"><td className="py-2">{fmtTime(i.created_at)}</td><td>{i.sites?.name}</td><td>{i.title}</td><td><SeverityBadge s={i.severity} /></td><td><StatusBadge s={i.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </Page>
  );
}
