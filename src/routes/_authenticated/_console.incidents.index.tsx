import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page, Stat } from "@/components/page";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IncidentForm } from "@/components/incident-form";
import { STATUS_LABEL, fmtDateTime, fmtDuration, minutesBetween } from "@/lib/labels";
import { useMe, useStaffList } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/incidents/")({
  head: () => ({ meta: [{ title: "งานแจ้งซ่อม — Go Inno Parking Ops" }, { name: "description", content: "ติดตามงานแจ้งซ่อมและสาเหตุปัญหา" }] }),
  component: Incidents,
});

function Incidents() {
  const { user } = useMe();
  const staff = useStaffList();
  const [status, setStatus] = useState("active");
  const [sev, setSev] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["incidents-all"],
    queryFn: async () => (await supabase.from("incidents").select("*, sites(name), equipment(name)").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });
  const all = q.data ?? [];
  const rows = all.filter((i) =>
    (status === "all" || (status === "active" ? !["resolved", "closed"].includes(i.status) : i.status === status)) &&
    (sev === "all" || i.severity === sev) &&
    (!search || `${i.code} ${i.title} ${i.sites?.name}`.toLowerCase().includes(search.toLowerCase())),
  );
  const name = (id?: string | null) => staff.data?.find((s) => s.id === id)?.full_name ?? "-";
  const done = all.filter((i) => i.resolved_at);
  const avg = done.length ? Math.round(done.reduce((a, i) => a + (minutesBetween(i.created_at, i.resolved_at) ?? 0), 0) / done.length) : null;

  return (
    <Page title="งานแจ้งซ่อม" subtitle="ติดตามการแก้ไข สาเหตุปัญหา และผู้รับผิดชอบ" actions={<Button onClick={() => setOpen(true)}><Plus />แจ้งปัญหาใหม่</Button>}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="รอดำเนินการ" value={all.filter((i) => i.status === "open").length} tone="text-destructive" />
        <Stat label="กำลังดำเนินการ" value={all.filter((i) => ["assigned", "in_progress", "waiting_parts"].includes(i.status)).length} tone="text-warning" />
        <Stat label="แก้ไขแล้ว" value={done.length} tone="text-success" />
        <Stat label="เวลาแก้ไขเฉลี่ย" value={fmtDuration(avg)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="ค้นหา รหัส / ปัญหา / จุด" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="active">งานที่ยังไม่เสร็จ</SelectItem><SelectItem value="all">ทั้งหมด</SelectItem>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sev} onValueChange={setSev}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">ทุกระดับ</SelectItem><SelectItem value="critical">วิกฤต</SelectItem><SelectItem value="high">สูง</SelectItem><SelectItem value="medium">กลาง</SelectItem><SelectItem value="low">ต่ำ</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">รหัส</th><th>วันที่แจ้ง</th><th>จุด / อุปกรณ์</th><th>ปัญหา</th><th>ระดับ</th><th>สถานะ</th><th>ผู้รับผิดชอบ</th><th>ระยะเวลา</th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t hover:bg-muted/50">
                <td className="p-3"><Link to="/incidents/$id" params={{ id: i.id }} className="font-mono text-primary">{i.code}</Link></td>
                <td>{fmtDateTime(i.created_at)}</td>
                <td>{i.sites?.name} · {i.equipment?.name}</td>
                <td className="max-w-56 truncate">{i.title}</td>
                <td><SeverityBadge s={i.severity} /></td>
                <td><StatusBadge s={i.status} /></td>
                <td>{name(i.assignee_id)}</td>
                <td>{fmtDuration(minutesBetween(i.created_at, i.resolved_at ?? new Date().toISOString()))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">ไม่มีรายการ</td></tr>}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>แจ้งปัญหาใหม่</DialogTitle></DialogHeader>
          <IncidentForm userId={user.id} onDone={() => { setOpen(false); q.refetch(); }} />
        </DialogContent>
      </Dialog>
    </Page>
  );
}
