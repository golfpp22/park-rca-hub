import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function uploadPhotos(folder: string, files: File[]) {
  const paths: string[] = [];
  for (const f of files) {
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, f, { contentType: f.type });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export function useSignedUrls(paths: string[] | null | undefined) {
  const list = paths ?? [];
  return useQuery({
    queryKey: ["signed", list],
    enabled: list.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("photos").createSignedUrls(list, 3600);
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    },
  });
}
