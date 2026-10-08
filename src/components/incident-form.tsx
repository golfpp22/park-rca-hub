import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { uploadPhotos } from "@/lib/photos";
import { useProblemTypes, useSites } from "@/lib/use-me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoPicker } from "@/components/photos";
import { cn } from "@/lib/utils";

const schema = z.object({
  site_id: z.string().uuid({ message: "เลือกจุด" }),
  equipment_id: z.string().uuid({ message: "เลือกอุปกรณ์" }),
  title: z.string().trim().min(3, "ระบุหัวข้อปัญหา").max(150),
  description: z.string().max(2000),
});

export function IncidentForm({ userId, onDone }: { userId: string; onDone: (id: string) => void }) {
  const sites = useSites();
  const [f, setF] = useState({ site_id: "", equipment_id: "", title: "", category: PROBLEM_TYPES[0], severity: "medium" as "low" | "medium" | "high" | "critical", description: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const eq = useQuery({
    queryKey: ["eq-of", f.site_id],
    enabled: !!f.site_id,
    queryFn: async () => (await supabase.from("equipment").select("id, name").eq("site_id", f.site_id).order("sort_order")).data ?? [],
  });

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"); return; }
    setBusy(true);
    try {
      const photos = files.length ? await uploadPhotos("incidents", files) : [];
      const { data, error } = await supabase.from("incidents").insert({ ...f, photos, reporter_id: userId }).select("id").single();
      if (error) throw error;
      await supabase.from("incident_logs").insert({ incident_id: data.id, actor_id: userId, action: "แจ้งปัญหา", note: f.description || null });
      await supabase.from("equipment").update({ status: "fault" }).eq("id", f.equipment_id);
      toast.success("แจ้งปัญหาเรียบร้อย");
      onDone(data.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>จุดติดตั้ง</Label>
          <Select value={f.site_id} onValueChange={(v) => setF({ ...f, site_id: v, equipment_id: "" })}>
            <SelectTrigger><SelectValue placeholder="เลือกจุด" /></SelectTrigger>
            <SelectContent>{sites.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.direction})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>อุปกรณ์</Label>
          <Select value={f.equipment_id} onValueChange={(v) => setF({ ...f, equipment_id: v })} disabled={!f.site_id}>
            <SelectTrigger><SelectValue placeholder="เลือกอุปกรณ์" /></SelectTrigger>
            <SelectContent>{eq.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>ประเภทปัญหา</Label>
        <div className="flex flex-wrap gap-2">
          {PROBLEM_TYPES.map((p) => (
            <button key={p} type="button" onClick={() => setF({ ...f, category: p, title: f.title || p })} className={cn("rounded-full border px-3 py-1 text-xs", f.category === p && "border-primary bg-primary text-primary-foreground")}>{p}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5"><Label>หัวข้อปัญหา</Label><Input value={f.title} maxLength={150} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="เช่น ไม้กั้นไม่ยก" /></div>
      <div className="space-y-1.5">
        <Label>ระดับความรุนแรง</Label>
        <div className="grid grid-cols-4 gap-2">
          {([["low", "ต่ำ"], ["medium", "กลาง"], ["high", "สูง"], ["critical", "วิกฤต"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setF({ ...f, severity: v })} className={cn("rounded-lg border py-2 text-sm", f.severity === v && "border-destructive bg-destructive/10 text-destructive")}>{l}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea value={f.description} maxLength={2000} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>แนบรูปภาพ</Label><PhotoPicker files={files} onChange={setFiles} /></div>
      <Button className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}ส่งแจ้งปัญหา</Button>
    </form>
  );
}
