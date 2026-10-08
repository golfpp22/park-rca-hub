import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Home, LayoutDashboard, LogOut, Percent, Wrench, TriangleAlert } from "lucide-react";
import { signOut, useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "แอปพนักงาน — Go Inno Parking Ops" }, { name: "description", content: "ตรวจเช็คอุปกรณ์ แจ้งซ่อม และติดตามงาน" }] }),
  component: StaffLayout,
});

const NAV = [
  { to: "/app", label: "หน้าหลัก", icon: Home, exact: true },
  { to: "/app/inspect", label: "ตรวจเช็ค", icon: ClipboardCheck },
  { to: "/app/report", label: "แจ้งซ่อม", icon: TriangleAlert },
  { to: "/app/jobs", label: "งานซ่อม", icon: Wrench },
  { to: "/app/discount", label: "ส่วนลด", icon: Percent },
] as const;

function StaffLayout() {
  const { profile, is } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background pb-20">
      <header className="bg-hero px-5 pb-6 pt-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">สวัสดี</p>
            <p className="font-semibold">{profile?.full_name || "พนักงาน"} <span className="text-xs opacity-80">({profile?.employee_code})</span></p>
          </div>
          <div className="flex gap-2">
            {is("admin", "executive", "operator") && (
              <Link to="/incidents" className="rounded-full bg-primary-foreground/15 p-2" aria-label="ระบบจัดการ"><LayoutDashboard className="size-4" /></Link>
            )}
            <button onClick={() => signOut(navigate, qc)} className="rounded-full bg-primary-foreground/15 p-2" aria-label="ออกจากระบบ"><LogOut className="size-4" /></button>
          </div>
        </div>
      </header>
      <main className="-mt-3 flex-1 rounded-t-2xl bg-background px-4 pt-4">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-md grid-cols-5 border-t bg-card">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground data-[status=active]:text-primary">
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
