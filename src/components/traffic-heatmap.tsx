import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { Panel } from "@/components/page";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trafficCells, trafficLevel, type TrafficMetric, type TrafficRow } from "@/lib/traffic-heatmap";

type Site = { id: string; name: string; direction: string };
const tones = ["heat-zero", "heat-1", "heat-2", "heat-3", "heat-4", "heat-5"];
const labels = { entries: "รถเข้า", exits: "รถออก", total: "เข้า + ออก" };

export function TrafficHeatmap({ sites, rows, date }: { sites: Site[]; rows: TrafficRow[]; date: string }) {
  const [metric, setMetric] = useState<TrafficMetric>("total");
  const data = sites.map((site) => ({ ...site, cells: trafficCells(rows, site.id, metric) }));
  const max = Math.max(0, ...data.flatMap((site) => site.cells.map((value) => value ?? 0)));
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Heatmap ปริมาณรถรายชั่วโมง แยกจุดเข้า-ออก</h3>
          <p className="mt-1 text-xs text-muted-foreground">{date} · {labels[metric]} · คัน/ชั่วโมง</p>
        </div>
        <ToggleGroup type="single" value={metric} size="sm" variant="outline" aria-label="ประเภทปริมาณรถ" onValueChange={(value) => { if (value === "entries" || value === "exits" || value === "total") setMetric(value); }}>
          <ToggleGroupItem value="total" aria-label="เข้า + ออก"><ArrowLeftRight className="mr-1 size-3.5" />เข้า + ออก</ToggleGroupItem>
          <ToggleGroupItem value="entries" aria-label="รถเข้า"><ArrowDownLeft className="mr-1 size-3.5" />รถเข้า</ToggleGroupItem>
          <ToggleGroupItem value="exits" aria-label="รถออก"><ArrowUpRight className="mr-1 size-3.5" />รถออก</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {!rows.length && <p className="mb-3 text-sm text-muted-foreground">ไม่มีข้อมูลปริมาณรถสำหรับวันที่เลือก</p>}
      <div className="overflow-x-auto" role="region" aria-label="ตาราง Heatmap ปริมาณรถรายชั่วโมง" tabIndex={0}>
        <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-1 text-xs">
          <caption className="sr-only">ปริมาณ{labels[metric]}แต่ละจุด ตั้งแต่ 00:00 ถึง 23:00 วันที่ {date}</caption>
          <thead><tr><th scope="col" className="sticky left-0 z-10 w-32 bg-card text-left text-muted-foreground">จุดเข้า-ออก</th>{Array.from({ length: 24 }, (_, hour) => <th scope="col" key={hour} className="pb-2 font-normal text-muted-foreground">{String(hour).padStart(2, "0")}</th>)}<th scope="col" className="w-16 pb-2 text-right text-muted-foreground">รวม</th></tr></thead>
          <tbody>{data.map((site) => <tr key={site.id}>
            <th scope="row" className="sticky left-0 z-10 bg-card py-2 pr-2 text-left font-medium"><span className="block truncate" title={site.name}>{site.name}</span><span className="text-[10px] font-normal text-muted-foreground">{site.direction}</span></th>
            {site.cells.map((value, hour) => <td key={hour} tabIndex={0} title={`${site.name} · ${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59 · ${labels[metric]} ${value === null ? "ไม่มีข้อมูล" : `${value.toLocaleString()} คัน`}`} className={`h-11 rounded-sm text-center tabular-nums outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring ${value === null ? "bg-muted/40 text-muted-foreground" : tones[trafficLevel(value, max)]}`}>
              {value === null ? "—" : value.toLocaleString()}
            </td>)}
            <td className="text-right font-semibold tabular-nums">{site.cells.every((value) => value === null) ? "—" : site.cells.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString()}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>สูงสุด {max.toLocaleString()} คัน/ชั่วโมง</span>
        <div className="flex items-center gap-2"><span>ไม่มีข้อมูล —</span><span className="ml-2">น้อย</span><div className="flex gap-1">{tones.map((tone) => <span key={tone} className={`h-3 w-5 rounded-sm ${tone}`} />)}</div><span>มาก</span></div>
      </div>
    </Panel>
  );
}