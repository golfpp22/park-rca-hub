import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { IncidentForm } from "@/components/incident-form";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app/report")({ component: Report });

function Report() {
  const { user } = useMe();
  const navigate = useNavigate();
  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-lg font-bold">แจ้งปัญหาการใช้งานระบบ</h1>
      <div className="rounded-xl bg-card p-4 shadow-card">
        <IncidentForm userId={user.id} onDone={(id) => navigate({ to: "/app/jobs/$id", params: { id } })} />
      </div>
    </div>
  );
}
