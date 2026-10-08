import { Camera, X } from "lucide-react";
import { useSignedUrls } from "@/lib/photos";

export function PhotoPicker({ files, onChange, max = 6 }: { files: File[]; onChange: (f: File[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f, i) => (
        <div key={i} className="relative size-20 overflow-hidden rounded-lg border">
          <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
          <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-foreground/70 p-0.5 text-background">
            <X className="size-3" />
          </button>
        </div>
      ))}
      {files.length < max && (
        <label className="grid size-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted">
          <Camera className="size-6" />
          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => onChange([...files, ...Array.from(e.target.files ?? [])].slice(0, max))} />
        </label>
      )}
    </div>
  );
}

export function PhotoGrid({ paths }: { paths: string[] | null | undefined }) {
  const { data } = useSignedUrls(paths);
  if (!paths?.length) return <p className="text-sm text-muted-foreground">ไม่มีรูปภาพ</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {(data ?? []).map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer" className="size-24 overflow-hidden rounded-lg border">
          <img src={u} alt="" className="size-full object-cover" />
        </a>
      ))}
    </div>
  );
}
