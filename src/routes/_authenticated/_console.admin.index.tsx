import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStaff, deleteStaff, updateStaff } from "@/lib/admin.functions";
import { ROLE_LABEL, type AppRole } from "@/lib/labels";
import { useMe, useStaffList } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/admin/")({
  head: () => ({ meta: [{ title: "จัดการผู้ใช้งาน — Admin" }, { name: "description", content: "เพิ่ม ลบ และกำหนดสิทธิ์ผู้ใช้งาน" }] }),
  component: AdminUsers,
});

type Form = { id?: string; code: string; name: string; password: string; role: AppRole; position: string; phone: string; active: boolean };
const empty: Form = { code: "", name: "", password: "", role: "technician", position: "", phone: "", active: true };

function AdminUsers() {
  const { is } = useMe();
  const staff = useStaffList();
  const create = useServerFn(createStaff);
  const update = useServerFn(updateStaff);
  const remove = useServerFn(deleteStaff);
  const [f, setF] = useState<Form | null>(null);
  const [del, setDel] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!is("admin")) return <Page title="ไม่มีสิทธิ์"><p>เฉพาะผู้ดูแลระบบ</p></Page>;

  async function save() {
    if (!f) return;
    setBusy(true);
    try {
      if (f.id) await update({ data: { id: f.id, name: f.name, role: f.role, active: f.active, position: f.position || null, phone: f.phone || null, password: f.password || undefined } });
      else await create({ data: { code: f.code, name: f.name, password: f.password, role: f.role, position: f.position || undefined, phone: f.phone || undefined } });
      toast.success("บันทึกแล้ว");
      setF(null);
      staff.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="ผู้ใช้งาน & สิทธิ์การเข้าถึง" subtitle="เพิ่ม-ลบพนักงาน และกำหนดระดับการใช้งานระบบ" actions={<Button onClick={() => setF({ ...empty })}><Plus />เพิ่มพนักงาน</Button>}>
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(ROLE_LABEL) as AppRole[]).map((r) => (
          <div key={r} className="rounded-xl bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">{ROLE_LABEL[r]}</p><p className="font-display text-2xl font-semibold">{staff.data?.filter((s) => s.roles.includes(r)).length ?? 0}</p></div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">รหัส</th><th>ชื่อ</th><th>ตำแหน่ง</th><th>โทร</th><th>ระดับสิทธิ์</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>
            {staff.data?.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-mono">{s.employee_code}</td><td className="font-medium">{s.full_name}</td><td>{s.position ?? "-"}</td><td>{s.phone ?? "-"}</td>
                <td>{s.roles.map((r) => ROLE_LABEL[r]).join(", ")}</td>
                <td>{s.active ? <span className="text-success">ใช้งาน</span> : <span className="text-muted-foreground">ปิดใช้งาน</span>}</td>
                <td className="pr-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setF({ id: s.id, code: s.employee_code, name: s.full_name, password: "", role: s.roles[0] ?? "technician", position: s.position ?? "", phone: s.phone ?? "", active: s.active })}><Pencil /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDel({ id: s.id, name: s.full_name })}><Trash2 className="text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{f?.id ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}</DialogTitle></DialogHeader>
          {f && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>รหัสพนักงาน</Label><Input value={f.code} disabled={!!f.id} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="TEC-001" /></div>
                <div className="space-y-1.5"><Label>ชื่อ-นามสกุล</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>ตำแหน่ง</Label><Input value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>โทรศัพท์</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>ระดับสิทธิ์</Label>
                <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as AppRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(ROLE_LABEL) as AppRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>{f.id ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน (อย่างน้อย 8 ตัว)"}</Label><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
              {f.id && <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} />เปิดใช้งานบัญชี</label>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setF(null)}>ยกเลิก</Button><Button onClick={save} disabled={busy}>บันทึก</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ลบพนักงาน {del?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">บัญชีจะถูกลบถาวร ประวัติงานซ่อมยังคงอยู่</p>
          <DialogFooter><Button variant="outline" onClick={() => setDel(null)}>ยกเลิก</Button>
            <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); try { await remove({ data: { id: del!.id } }); toast.success("ลบแล้ว"); setDel(null); staff.refetch(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
