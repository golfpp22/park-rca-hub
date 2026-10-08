import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { IncidentDetail } from "@/components/incident-detail";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app/jobs/$id")({ component: Job });

function Job() {
  const { id } = Route.useParams();
  const { user, is } = useMe();
  return (
    <div className="space-y-3 pb-4">
      <Link to="/app/jobs" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" />กลับ</Link>
      <IncidentDetail id={id} userId={user.id} canAssign={is("admin", "operator")} />
    </div>
  );
}
