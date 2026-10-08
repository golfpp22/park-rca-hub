import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useSites } from "@/lib/use-me";
import { fmtDateTime } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/discount")({ component: Discount });

const TYPES: [string, ...string[]] = ["ร้านค้า", "สมาชิก", "VIP", "ผู้ติดต่อราชการ", "อื่นๆ"];
const schema = z.object({
  plate: z.string().trim().min(2, "ระบุทะเบียนรถ").max(20),
  amount: z.coerce.number().min(0).max(100000),
  reason: z.string().max(300),
});

function Discount() {
  const { user } = useMe();
  const sites = useSites();
  const qc = useQueryClient();
  const [f, setF] = useState({ plate: "", amount: "", discount_type: TYPES[0], site_id: "", reason: "" });
  const list = useQuery({
    queryKey: ["discounts-recent"],
    queryFn: async () => (await supabase.from("discounts").select("*, sites(name)").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  async function submit(e: React.FormEvent): Promise<unknown> {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"); return; }
    const { error } = await supabase.from("discounts").insert({ plate: p.data.plate, amount: p.data.amount, reason: p.data.reason || null, discount_type: f.discount_type, site_id: f.site_id || null, recorded_by: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("บันทึกส่วนลดแล้ว");
    setF({ ...f, plate: "", amount: "", reason: "" });
    qc.invalidateQueries({ queryKey: ["discounts-recent"] });
  }
  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-lg font-bold">บันทึกส่วนลดค่าจอด</h1>
      <form onSubmit={submit} className="space-y-3 rounded-xl bg-card p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>ทะเบียนรถ</Label><Input value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} placeholder="กข 1234" /></div>
          <div className="space-y-1.5"><Label>จำนวนเงิน (บาท)</Label><Input type="number" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>ประเภท</Label>
            <Select value={f.discount_type} onValueChange={(v) => setF({ ...f, discount_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>จุด</Label>
            <Select value={f.site_id} onValueChange={(v) => setF({ ...f, site_id: v })}><SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger><SelectContent>{sites.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>เหตุผล / ร้านค้า</Label><Input value={f.reason} maxLength={300} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        <Button className="w-full">บันทึกส่วนลด</Button>
      </form>
      <div className="space-y-2">
        <p className="font-semibold">รายการล่าสุด</p>
        {list.data?.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl bg-card p-3 text-sm shadow-card">
            <div><p className="font-medium">{d.plate}</p><p className="text-xs text-muted-foreground">{d.discount_type} · {d.sites?.name ?? "-"} · {fmtDateTime(d.created_at)}</p></div>
            <span className="font-semibold text-success">-{Number(d.amount).toLocaleString()} ฿</span>
          </div>
        ))}
      </div>
    </div>
  );
}
