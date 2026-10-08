import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { STATUS_LABEL, fmtDateTime, fmtDuration, minutesBetween } from "@/lib/labels";
import { uploadPhotos } from "@/lib/photos";
import { useStaffList } from "@/lib/use-me";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { PhotoGrid, PhotoPicker } from "@/components/photos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = keyof typeof STATUS_LABEL;

export function IncidentDetail({ id, userId, canAssign }: { id: string; userId: string; canAssign: boolean }) {
  const qc = useQueryClient();
  const staff = useStaffList();
  const q = useQuery({
    queryKey: ["incident", id],
    queryFn: async () => {
      const [{ data: inc }, { data: logs }] = await Promise.all([
        supabase.from("incidents").select("*, sites(name, direction), equipment(name, asset_code)").eq("id", id).single(),
        supabase.from("incident_logs").select("*").eq("incident_id", id).order("created_at", { ascending: false }),
      ]);
      return { inc, logs: logs ?? [] };
    },
  });
  const inc = q.data?.inc;
  const [form, setForm] = useState<{ status?: Status; root_cause?: string; resolution?: string; parts_used?: string; note: string; assignee?: string }>({ note: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const nameOf = (uid?: string | null) => staff.data?.find((s) => s.id === uid)?.full_name ?? "-";

  if (!inc) return <div className="p-6 text-muted-foreground">กำลังโหลด...</div>;

  const status = form.status ?? inc.status;
  const mine = inc.assignee_id === userId;

  async function save(patch?: Partial<typeof form>) {
    const f = { ...form, ...patch };
    setBusy(true);
    try {
      const after = files.length ? await uploadPhotos(`incidents/${id}/after`, files) : [];
      const update: TablesUpdate<"incidents"> = {};
      if (f.status && f.status !== inc!.status) update.status = f.status;
      if (f.assignee && f.assignee !== inc!.assignee_id) { update.assignee_id = f.assignee; if (inc!.status === "open" && !f.status) update.status = "assigned"; }
      if (f.root_cause !== undefined) update.root_cause = f.root_cause;
      if (f.resolution !== undefined) update.resolution = f.resolution;
      if (f.parts_used !== undefined) update.parts_used = f.parts_used;
      if (after.length) update.after_photos = [...(inc!.after_photos ?? []), ...after];
      if ((update.status === "resolved" || update.status === "closed") && !(f.root_cause ?? inc!.root_cause)) throw new Error("กรุณาระบุสาเหตุของปัญหาก่อนปิดงาน");
      const { error } = await supabase.from("incidents").update(update).eq("id", id);
      if (error) throw error;
      const actions: string[] = [];
      if (update.assignee_id) actions.push(`มอบหมายให้ ${nameOf(update.assignee_id)}`);
      if (update.status) actions.push(`เปลี่ยนสถานะเป็น ${STATUS_LABEL[update.status as Status]}`);
      if (!actions.length) actions.push("อัปเดตข้อมูล");
      await supabase.from("incident_logs").insert({ incident_id: id, actor_id: userId, action: actions.join(" · "), note: f.note || null });
      if (update.status === "resolved" || update.status === "closed") await supabase.from("equipment").update({ status: "online" }).eq("id", inc!.equipment_id!);
      setForm({ note: "" });
      setFiles([]);
      qc.invalidateQueries();
      toast.success("บันทึกแล้ว");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const resolveMin = minutesBetween(inc.created_at, inc.resolved_at ?? new Date().toISOString());

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{inc.code}</span><SeverityBadge s={inc.severity} /><StatusBadge s={inc.status} />
        </div>
        <h2 className="mt-2 text-lg font-bold">{inc.title}</h2>
        <p className="text-sm text-muted-foreground">{inc.sites?.name} ({inc.sites?.direction}) · {inc.equipment?.name} · {inc.category}</p>
        {inc.description && <p className="mt-3 text-sm">{inc.description}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">ผู้แจ้ง</dt><dd>{nameOf(inc.reporter_id)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">ผู้รับผิดชอบ</dt><dd>{nameOf(inc.assignee_id)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">แจ้งเมื่อ</dt><dd>{fmtDateTime(inc.created_at)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{inc.resolved_at ? "ใช้เวลาแก้ไข" : "เวลาที่ผ่านไป"}</dt><dd className="font-semibold">{fmtDuration(resolveMin)}</dd></div>
        </dl>
        <div className="mt-4"><p className="mb-2 text-xs text-muted-foreground">รูปขณะแจ้ง</p><PhotoGrid paths={inc.photos} /></div>
        {inc.after_photos?.length > 0 && <div className="mt-3"><p className="mb-2 text-xs text-muted-foreground">รูปหลังแก้ไข</p><PhotoGrid paths={inc.after_photos} /></div>}
        {(inc.root_cause || inc.resolution) && (
          <div className="mt-4 grid gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">สาเหตุ</p>{inc.root_cause || "-"}</div>
            <div><p className="text-xs text-muted-foreground">วิธีแก้ไข</p>{inc.resolution || "-"}</div>
          </div>
        )}
      </div>

      {inc.status !== "closed" && (
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-card">
          <p className="font-semibold">อัปเดตงานซ่อม</p>
          {!inc.assignee_id && !canAssign && (
            <Button variant="secondary" className="w-full" disabled={busy} onClick={() => save({ assignee: userId, status: "in_progress" })}>รับงานนี้</Button>
          )}
          {canAssign && (
            <div className="space-y-1.5">
              <Label>มอบหมายให้</Label>
              <Select value={form.assignee ?? inc.assignee_id ?? ""} onValueChange={(v) => setForm({ ...form, assignee: v })}>
                <SelectTrigger><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
                <SelectContent>{staff.data?.filter((s) => s.active).map((s) => <SelectItem key={s.id} value={s.id}>{s.employee_code} · {s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {(mine || canAssign) && (
            <>
              <div className="space-y-1.5">
                <Label>สถานะ</Label>
                <Select value={status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(STATUS_LABEL) as Status[]).filter((s) => canAssign || s !== "closed").map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>สาเหตุของปัญหา</Label><Input defaultValue={inc.root_cause ?? ""} maxLength={300} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>วิธีแก้ไข</Label><Textarea defaultValue={inc.resolution ?? ""} maxLength={1000} onChange={(e) => setForm({ ...form, resolution: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>อะไหล่ที่ใช้</Label><Input defaultValue={inc.parts_used ?? ""} maxLength={300} onChange={(e) => setForm({ ...form, parts_used: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>รูปหลังแก้ไข</Label><PhotoPicker files={files} onChange={setFiles} /></div>
            </>
          )}
          <div className="space-y-1.5"><Label>บันทึกเพิ่มเติม</Label><Textarea value={form.note} maxLength={1000} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <Button className="w-full" disabled={busy} onClick={() => save()}>{busy && <Loader2 className="animate-spin" />}บันทึก</Button>
        </div>
      )}

      <div className="rounded-xl bg-card p-4 shadow-card">
        <p className="mb-3 font-semibold">ประวัติการดำเนินงาน</p>
        <ol className="space-y-3 border-l pl-4">
          {q.data?.logs.map((l) => (
            <li key={l.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
              <p className="font-medium">{l.action}</p>
              {l.note && <p className="text-muted-foreground">{l.note}</p>}
              <p className="text-xs text-muted-foreground">{nameOf(l.actor_id)} · {fmtDateTime(l.created_at)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
