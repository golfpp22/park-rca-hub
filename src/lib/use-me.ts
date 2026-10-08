import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./labels";

const authRoute = getRouteApi("/_authenticated");

export function useMe() {
  const { user } = authRoute.useRouteContext();
  const q = useQuery({
    queryKey: ["me", user.id],
    queryFn: async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return { profile, roles: (roles ?? []).map((r) => r.role as AppRole) };
    },
  });
  const roles = q.data?.roles ?? [];
  return {
    user,
    profile: q.data?.profile ?? null,
    roles,
    loading: q.isLoading,
    is: (...r: AppRole[]) => roles.some((x) => r.includes(x)),
  };
}

export function useStaffList() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("employee_code"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (p ?? []).map((x) => ({ ...x, roles: (r ?? []).filter((y) => y.user_id === x.id).map((y) => y.role as AppRole) }));
    },
  });
}

export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await supabase.from("sites").select("*").order("code")).data ?? [],
  });
}

export async function signOut(navigate: (o: { to: string; replace?: boolean }) => void, qc: { clear: () => void; cancelQueries: () => Promise<void> }) {
  await qc.cancelQueries();
  qc.clear();
  await supabase.auth.signOut();
  navigate({ to: "/", replace: true });
}
