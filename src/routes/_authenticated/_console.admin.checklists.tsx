import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page, Panel } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/_console/admin/checklists")({
  head: () => ({ meta: [{ title: "รายการตรวจเช็ค — Admin" }, { name: "description", content: "กำหนดรายการที่พนักงานต้องตรวจเช็คประจำวัน" }] }),
  component: AdminChecklists,
});

const TYPES = [["lpr", "LPR Camera"], ["barrier", "Barrier"], ["loop", "Loop Sensor"], ["kiosk", "Kiosk จ่ายบัตร/ชำระเงิน"], ["intercom", "Intercom"], ["cctv", "CCTV"], ["network", "Network Switch"], ["power", "Power Supply"]] as const;

function AdminChecklists() {
  const q = useQuery({ queryKey: ["checklists"], queryFn: async () => (await supabase.from("checklist_templates").select("*").order("sort_order")).data ?? [] });
  const [draft, setDraft] = useState<Record<string, string>>({});
  async function add(type: string) {
    const item = (draft[type] ?? "").trim();
    if (!item) return;
    const { error } = await supabase.from("checklist_templates").insert({ equipment_type: type, item: item.slice(0, 200), sort_order: 99 });
    if (error) return toast.error(error.message);
    setDraft({ ...draft, [type]: "" });
    q.refetch();
  }
  return (
    <Page title="รายการตรวจเช็คประจำวัน" subtitle="รายการเหล่านี้จะแสดงให้พนักงานตรวจในแอปตามประเภทอุปกรณ์">
      <div className="grid gap-4 lg:grid-cols-2">
        {TYPES.map(([t, label]) => (
          <Panel key={t} title={label}>
            <ul className="divide-y text-sm">
              {q.data?.filter((c) => c.equipment_type === t).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-1.5">{c.item}
                  <Button size="icon" variant="ghost" onClick={async () => { await supabase.from("checklist_templates").delete().eq("id", c.id); q.refetch(); }}><Trash2 className="size-4" /></Button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2"><Input placeholder="เพิ่มรายการตรวจ" value={draft[t] ?? ""} onChange={(e) => setDraft({ ...draft, [t]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add(t)} /><Button variant="secondary" onClick={() => add(t)}><Plus /></Button></div>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
