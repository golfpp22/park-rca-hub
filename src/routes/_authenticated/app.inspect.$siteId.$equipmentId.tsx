import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { PROBLEM_TYPES, todayStr } from "@/lib/labels";
import { uploadPhotos } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PhotoPicker } from "@/components/photos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/inspect/$siteId/$equipmentId")({ component: CheckEquipment });

function CheckEquipment() {
  const { siteId, equipmentId } = Route.useParams();
  const { user } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"ok" | "problem" | "note">("ok");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [problem, setProblem] = useState(PROBLEM_TYPES[0]);
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["check-eq", equipmentId],
    queryFn: async () => {
      const { data: eq } = await supabase.from("equipment").select("*, sites(name)").eq("id", equipmentId).single();
      const { data: items } = await supabase.from("checklist_templates").select("*").eq("equipment_type", eq!.type).order("sort_order");
      const { data: ins } = await supabase.from("inspections").select("id").eq("site_id", siteId).eq("inspection_date", todayStr()).maybeSingle();
      return { eq, items: items ?? [], inspectionId: ins?.id };
    },
  });
  useEffect(() => {
    if (q.data) setChecks(Object.fromEntries(q.data.items.map((i) => [i.item, true])));
  }, [q.data]);

  async function save(): Promise<void> {
    if (!q.data?.inspectionId) { toast.error("ไม่พบใบตรวจเช็ควันนี้"); return; }
    if (status === "problem" && !note.trim()) { toast.error("กรุณาระบุรายละเอียดปัญหา"); return; }
    setBusy(true);
    try {
      const photos = files.length ? await uploadPhotos(`inspections/${q.data.inspectionId}`, files) : [];
      const { error } = await supabase.from("inspection_results").upsert(
        { inspection_id: q.data.inspectionId, equipment_id: equipmentId, status, checks: Object.entries(checks).map(([item, ok]) => ({ item, ok })), problem_type: status === "problem" ? problem : null, note: note || null, photos },
        { onConflict: "inspection_id,equipment_id" },
      );
      if (error) throw error;
      if (status === "problem") {
        const { data: inc } = await supabase.from("incidents").insert({
          site_id: siteId, equipment_id: equipmentId, title: `${q.data.eq?.name} ${problem}`, category: problem, severity, description: note, photos, reporter_id: user.id,
        }).select("id").single();
        if (inc) await supabase.from("incident_logs").insert({ incident_id: inc.id, actor_id: user.id, action: "แจ้งปัญหาจากการตรวจเช็ค", note });
        await supabase.from("equipment").update({ status: "fault" }).eq("id", equipmentId);
        toast.success("บันทึกและแจ้งซ่อมอัตโนมัติแล้ว");
      } else toast.success("บันทึกผลการตรวจแล้ว");
      qc.invalidateQueries();
      navigate({ to: "/app/inspect/$siteId", params: { siteId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <Link to="/app/inspect/$siteId" params={{ siteId }} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" />กลับ</Link>
      <div>
        <p className="text-xs text-muted-foreground">{q.data?.eq?.sites?.name} · {q.data?.eq?.asset_code}</p>
        <h1 className="text-lg font-bold">{q.data?.eq?.name}</h1>
      </div>

      <section className="rounded-xl bg-card p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold">รายการที่ต้องตรวจ</p>
        <div className="space-y-3">
          {q.data?.items.map((i) => (
            <label key={i.id} className="flex items-center gap-3 text-sm">
              <Checkbox checked={!!checks[i.item]} onCheckedChange={(v) => setChecks({ ...checks, [i.item]: !!v })} />
              {i.item}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-card p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold">สถานะการตรวจ</p>
        <div className="grid grid-cols-3 gap-2">
          {([["ok", "ปกติ", "border-success bg-success/10 text-success"], ["problem", "พบปัญหา", "border-destructive bg-destructive/10 text-destructive"], ["note", "หมายเหตุ", "border-warning bg-warning/20 text-warning-foreground"]] as const).map(([v, l, tone]) => (
            <button key={v} type="button" onClick={() => setStatus(v)} className={cn("rounded-lg border-2 py-2.5 text-sm font-medium", status === v ? tone : "border-border text-muted-foreground")}>{l}</button>
          ))}
        </div>
        {status === "problem" && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">ประเภทปัญหา</p>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_TYPES.map((p) => (
                  <button key={p} type="button" onClick={() => setProblem(p)} className={cn("rounded-full border px-3 py-1 text-xs", problem === p ? "border-primary bg-primary text-primary-foreground" : "")}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">ระดับความรุนแรง</p>
              <div className="grid grid-cols-4 gap-2">
                {([["low", "ต่ำ"], ["medium", "กลาง"], ["high", "สูง"], ["critical", "วิกฤต"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setSeverity(v)} className={cn("rounded-lg border py-2 text-xs", severity === v ? "border-destructive bg-destructive/10 text-destructive" : "")}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">รายละเอียด / หมายเหตุ</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} placeholder="อธิบายเพิ่มเติม..." />
        <p className="text-sm font-semibold">รูปภาพ</p>
        <PhotoPicker files={files} onChange={setFiles} />
      </section>

      <Button className="h-12 w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="animate-spin" />}บันทึกผลการตรวจ</Button>
    </div>
  );
}
