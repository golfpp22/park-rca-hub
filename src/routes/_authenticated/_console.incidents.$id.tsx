import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { IncidentDetail } from "@/components/incident-detail";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/_console/incidents/$id")({ component: IncidentPage });

function IncidentPage() {
  const { id } = Route.useParams();
  const { user, is } = useMe();
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <Link to="/incidents" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" />กลับไปรายการ</Link>
      <IncidentDetail id={id} userId={user.id} canAssign={is("admin", "operator")} />
    </div>
  );
}
