import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/_console/admin/sites")({
  head: () => ({ meta: [{ title: "จุดติดตั้ง & อุปกรณ์ — Admin" }, { name: "description", content: "ตั้งค่าจุดเข้า-ออกและอุปกรณ์" }] }),
  component: AdminSites,
});

const TYPES = [["lpr", "LPR Camera"], ["barrier", "Barrier"], ["loop", "Loop Sensor"], ["kiosk", "Kiosk"], ["intercom", "Intercom"], ["cctv", "CCTV"], ["network", "Network"], ["power", "Power Supply"]] as const;

function AdminSites() {
  const q = useQuery({
    queryKey: ["admin-sites"],
    queryFn: async () => {
      const [{ data: s }, { data: e }] = await Promise.all([supabase.from("sites").select("*").order("code"), supabase.from("equipment").select("*").order("sort_order")]);
      return { sites: s ?? [], eq: e ?? [] };
    },
  });
  const [site, setSite] = useState({ name: "", direction: "ทางเข้า" });
  const [eqForm, setEqForm] = useState<Record<string, { name: string; type: string }>>({});
  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) toast.error(error.message); else q.refetch(); };
  const nextCode = Math.max(0, ...(q.data?.sites.map((s) => s.code) ?? [])) + 1;

  return (
    <Page title="จุดติดตั้ง & อุปกรณ์" subtitle="จุดเข้า-ออก Kiosk จ่ายบัตร Kiosk ทางออก และอุปกรณ์ประจำจุด">
      <Panel title="เพิ่มจุดใหม่">
        <div className="flex flex-wrap gap-2">
          <Input className="w-48" placeholder={`จุด ${nextCode}`} value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} />
          <Select value={site.direction} onValueChange={(v) => setSite({ ...site, direction: v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["ทางเข้า", "ทางออก", "ทางเข้า-ออก"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          <Button onClick={() => { run(supabase.from("sites").insert({ code: nextCode, name: site.name || `จุด ${nextCode}`, direction: site.direction })); setSite({ name: "", direction: "ทางเข้า" }); }}><Plus />เพิ่มจุด</Button>
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {q.data?.sites.map((s) => {
          const f = eqForm[s.id] ?? { name: "", type: "lpr" };
          return (
            <Panel key={s.id} title={`${s.name} · ${s.direction}`} action={<Button size="icon" variant="ghost" onClick={() => confirm(`ลบ ${s.name} และอุปกรณ์ทั้งหมด?`) && run(supabase.from("sites").delete().eq("id", s.id))}><Trash2 className="text-destructive" /></Button>}>
              <ul className="divide-y text-sm">
                {q.data.eq.filter((e) => e.site_id === s.id).map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span>{e.name} <span className="text-xs text-muted-foreground">{e.asset_code}</span></span>
                    <span className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${e.status === "online" ? "bg-success" : "bg-destructive"}`} />
                      <Button size="icon" variant="ghost" onClick={() => run(supabase.from("equipment").delete().eq("id", e.id))}><Trash2 className="size-4" /></Button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input placeholder="ชื่ออุปกรณ์" value={f.name} onChange={(e) => setEqForm({ ...eqForm, [s.id]: { ...f, name: e.target.value } })} />
                <Select value={f.type} onValueChange={(v) => setEqForm({ ...eqForm, [s.id]: { ...f, type: v } })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
                <Button variant="secondary" onClick={() => { run(supabase.from("equipment").insert({ site_id: s.id, name: f.name || TYPES.find((t) => t[0] === f.type)![1], type: f.type, sort_order: 99 })); setEqForm({ ...eqForm, [s.id]: { name: "", type: f.type } }); }}><Plus /></Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </Page>
  );
}
