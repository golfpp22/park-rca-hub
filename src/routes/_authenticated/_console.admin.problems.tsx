import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/_console/admin/problems")({
  head: () => ({ meta: [{ title: "ประเภทปัญหา — Admin" }, { name: "description", content: "เพิ่ม ลบ แก้ไขประเภทปัญหาที่พนักงานเลือกตอนแจ้งซ่อม" }] }),
  component: AdminProblems,
});

type Row = { id: string; label: string; sort_order: number; active: boolean };
type Form = { id?: string; label: string; sort_order: number; active: boolean };

function AdminProblems() {
  const q = useQuery({
    queryKey: ["problem-types"],
    queryFn: async () => ((await supabase.from("problem_types").select("*").order("sort_order")).data ?? []) as Row[],
  });
  const [f, setF] = useState<Form | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(): Promise<void> {
    if (!f) return;
    const label = f.label.trim();
    if (label.length < 2) { toast.error("ระบุชื่อประเภทปัญหา"); return; }
    setBusy(true);
    try {
      const payload = { label: label.slice(0, 100), sort_order: f.sort_order, active: f.active };
      const { error } = f.id
        ? await supabase.from("problem_types").update(payload).eq("id", f.id)
        : await supabase.from("problem_types").insert(payload);
      if (error) throw error;
      toast.success("บันทึกแล้ว");
      setF(null);
      q.refetch();
    } catch (e) {
      toast.error((e as Error).message.includes("duplicate") ? "มีประเภทปัญหานี้อยู่แล้ว" : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="ประเภทปัญหา" subtitle="รายการนี้จะแสดงให้พนักงานเลือกตอนแจ้งปัญหาและตรวจเช็คอุปกรณ์" actions={<Button onClick={() => setF({ label: "", sort_order: (q.data?.length ?? 0) + 1, active: true })}><Plus />เพิ่มประเภทปัญหา</Button>}>
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">ลำดับ</th><th>ประเภทปัญหา</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>
            {q.data?.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono">{r.sort_order}</td>
                <td className="font-medium">{r.label}</td>
                <td>{r.active ? <span className="text-success">ใช้งาน</span> : <span className="text-muted-foreground">ซ่อน</span>}</td>
                <td className="pr-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setF({ id: r.id, label: r.label, sort_order: r.sort_order, active: r.active })}><Pencil /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDel(r)}><Trash2 className="text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{f?.id ? "แก้ไขประเภทปัญหา" : "เพิ่มประเภทปัญหา"}</DialogTitle></DialogHeader>
          {f && (
            <div className="grid gap-3">
              <div className="space-y-1.5"><Label>ชื่อประเภทปัญหา</Label><Input value={f.label} maxLength={100} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="เช่น ไม้กั้นไม่ยก" /></div>
              <div className="space-y-1.5"><Label>ลำดับการแสดง</Label><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) || 0 })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} />แสดงให้พนักงานเลือก</label>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setF(null)}>ยกเลิก</Button><Button onClick={save} disabled={busy}>บันทึก</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ลบ "{del?.label}"?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">งานแจ้งซ่อมเดิมที่ใช้ประเภทนี้จะยังคงอยู่ แต่พนักงานจะเลือกประเภทนี้ไม่ได้อีก</p>
          <DialogFooter><Button variant="outline" onClick={() => setDel(null)}>ยกเลิก</Button>
            <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); try { const { error } = await supabase.from("problem_types").delete().eq("id", del!.id); if (error) throw error; toast.success("ลบแล้ว"); setDel(null); q.refetch(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
