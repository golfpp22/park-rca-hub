import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { codeToEmail, homeForRoles, type AppRole } from "@/lib/labels";
import { needsSetup } from "@/lib/admin.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Go Inno Parking Ops" },
      { name: "description", content: "เข้าสู่ระบบด้วยรหัสพนักงาน เพื่อแจ้งซ่อม ตรวจเช็คอุปกรณ์ และดู Dashboard ลานจอดรถ" },
      { property: "og:title", content: "Go Inno Parking Ops" },
      { property: "og:description", content: "ระบบบริหารลานจอดรถ แจ้งซ่อม และตรวจเช็คประจำวัน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

async function goHome(navigate: ReturnType<typeof useNavigate>, uid: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  navigate({ to: homeForRoles((data ?? []).map((r) => r.role as AppRole)), replace: true });
}

function Login() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const setup = useQuery({ queryKey: ["needsSetup"], queryFn: () => needsSetup() });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && goHome(navigate, data.user.id));
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(code.trim())) return toast.error("รหัสพนักงานไม่ถูกต้อง");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: codeToEmail(code), password });
    setBusy(false);
    if (error || !data.user) return toast.error("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
    goHome(navigate, data.user.id);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <div className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15"><Car className="size-5" /></div>
          Go Inno Parking Ops
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">ระบบบริหารลานจอดรถ<br />และงานซ่อมบำรุงอุปกรณ์</h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">แจ้งปัญหา ติดตามการแก้ไข ตรวจเช็ค Kiosk จ่ายบัตร Kiosk ทางออก และระบบชำระเงินประจำวัน พร้อม Dashboard สำหรับผู้บริหาร</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {["แจ้งซ่อม & ติดตาม", "ตรวจเช็คประจำวัน", "KPI พนักงาน"].map((t) => (
            <div key={t} className="rounded-xl bg-primary-foreground/10 p-4">{t}</div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">เข้าสู่ระบบ</h2>
            <p className="text-sm text-muted-foreground">ใช้รหัสพนักงานและรหัสผ่านที่ได้รับจากผู้ดูแลระบบ</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">รหัสพนักงาน</Label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="code" className="h-11 pl-9 uppercase" placeholder="เช่น TEC-001" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="username" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">รหัสผ่าน</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="pw" type="password" className="h-11 pl-9" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} เข้าสู่ระบบ
          </Button>
          {setup.data?.needsSetup && (
            <div className="rounded-lg border border-dashed p-4 text-sm">
              ยังไม่มีผู้ดูแลระบบ — <Link to="/setup" className="font-medium text-primary underline">ตั้งค่าบัญชี Admin แรก</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
