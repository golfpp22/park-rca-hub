import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "ตั้งค่าผู้ดูแลระบบ — Go Inno Parking Ops" },
      { name: "description", content: "สร้างบัญชีผู้ดูแลระบบคนแรก" },
      { property: "og:title", content: "ตั้งค่าผู้ดูแลระบบ" },
      { property: "og:description", content: "สร้างบัญชีผู้ดูแลระบบคนแรก" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const run = useServerFn(bootstrapAdmin);
  const [f, setF] = useState({ code: "ADMIN", name: "", password: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await run({ data: f });
      toast.success("สร้างบัญชี Admin แล้ว กรุณาเข้าสู่ระบบ");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">สร้างบัญชีผู้ดูแลระบบคนแรก</h1>
        <div className="space-y-2"><Label>รหัสพนักงาน</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
        <div className="space-y-2"><Label>ชื่อ-นามสกุล</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>รหัสผ่าน (อย่างน้อย 8 ตัว)</Label><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Button className="w-full" disabled={busy}>สร้างบัญชี</Button>
      </form>
    </div>
  );
}
