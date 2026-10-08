import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Page, Stat } from "@/components/page";
import { fmtDateTime } from "@/lib/labels";
import { useStaffList } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/discounts")({
  head: () => ({ meta: [{ title: "รายงานส่วนลด — Go Inno Parking Ops" }, { name: "description", content: "รายการบันทึกส่วนลดค่าจอดรถ" }] }),
  component: Discounts,
});

function Discounts() {
  const staff = useStaffList();
  const q = useQuery({
    queryKey: ["discounts-all"],
    queryFn: async () => (await supabase.from("discounts").select("*, sites(name)").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });
  const rows = q.data ?? [];
  const today = new Date().toDateString();
  const todayRows = rows.filter((r) => new Date(r.created_at).toDateString() === today);
  return (
    <Page title="รายงานส่วนลดค่าจอด" subtitle="ส่วนลดที่พนักงานบันทึกผ่านระบบออนไลน์">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="รายการวันนี้" value={todayRows.length} />
        <Stat label="ส่วนลดวันนี้" value={`฿${todayRows.reduce((a, r) => a + Number(r.amount), 0).toLocaleString()}`} tone="text-warning" />
        <Stat label="ส่วนลดทั้งหมด" value={`฿${rows.reduce((a, r) => a + Number(r.amount), 0).toLocaleString()}`} />
      </div>
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">วันที่</th><th>ทะเบียน</th><th>ประเภท</th><th>จุด</th><th>เหตุผล</th><th>ผู้บันทึก</th><th className="pr-3 text-right">จำนวน</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t"><td className="p-3">{fmtDateTime(r.created_at)}</td><td className="font-medium">{r.plate}</td><td>{r.discount_type}</td><td>{r.sites?.name ?? "-"}</td><td>{r.reason ?? "-"}</td><td>{staff.data?.find((s) => s.id === r.recorded_by)?.full_name ?? "-"}</td><td className="pr-3 text-right font-semibold">฿{Number(r.amount).toLocaleString()}</td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">ยังไม่มีรายการ</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
