import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Car, ClipboardList, Gauge, ListChecks, LogOut, MapPin, Percent, Smartphone, Trophy, Users, Wrench } from "lucide-react";
import { signOut, useMe } from "@/lib/use-me";
import { ROLE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_console")({ component: ConsoleLayout });

const OPS = [
  { to: "/dashboard", label: "Dashboard ผู้บริหาร", icon: Gauge },
  { to: "/incidents", label: "งานแจ้งซ่อม", icon: Wrench },
  { to: "/inspections", label: "รายงานตรวจเช็ค", icon: ClipboardList },
  { to: "/kpi", label: "KPI พนักงาน", icon: Trophy },
  { to: "/discounts", label: "รายงานส่วนลด", icon: Percent },
] as const;
const ADMIN = [
  { to: "/admin", label: "ผู้ใช้งาน & สิทธิ์", icon: Users },
  { to: "/admin/sites", label: "จุดติดตั้ง & อุปกรณ์", icon: MapPin },
  { to: "/admin/checklists", label: "รายการตรวจเช็ค", icon: ListChecks },
] as const;

function ConsoleLayout() {
  const { profile, roles, is, loading } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  if (loading) return null;
  if (!is("admin", "executive", "operator")) return <Navigate to="/app" />;
  const dark = pathname.startsWith("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-semibold text-sidebar-accent-foreground">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary"><Car className="size-5" /></span>
          Parking Ops
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          <NavGroup title="ปฏิบัติการ" items={OPS} />
          {is("admin") && <NavGroup title="หลังบ้าน (Admin)" items={ADMIN} />}
          <div>
            <Link to="/app" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"><Smartphone className="size-4" />แอปพนักงาน</Link>
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-4 text-sm">
          <p className="font-medium text-sidebar-accent-foreground">{profile?.full_name}</p>
          <p className="text-xs">{roles.map((r) => ROLE_LABEL[r]).join(", ")}</p>
          <button onClick={() => signOut(navigate, qc)} className="mt-3 flex items-center gap-2 text-xs hover:text-sidebar-accent-foreground"><LogOut className="size-3.5" />ออกจากระบบ</button>
        </div>
      </aside>
      <div className={cn("min-w-0 flex-1", dark && "dark")}>
        <div className="min-h-screen bg-background text-foreground">
          <div className="flex gap-1 overflow-x-auto border-b bg-sidebar p-2 md:hidden">
            {[...OPS, ...(is("admin") ? ADMIN : [])].map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-sidebar-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground">{n.label}</Link>
            ))}
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function NavGroup({ title, items }: { title: string; items: readonly { to: string; label: string; icon: typeof BarChart3 }[] }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] uppercase tracking-wider opacity-60">{title}</p>
      {items.map((n) => (
        <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/admin" }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground">
          <n.icon className="size-4" />{n.label}
        </Link>
      ))}
    </div>
  );
}
