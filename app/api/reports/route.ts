import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { format } from "date-fns";
import { demoState } from "@/lib/demo-data";
import { getWeekRange, pageTasks } from "@/lib/week";
import { createClient } from "@/lib/supabase/server";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

function safeFilename(value: string) { return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-"); }

export async function GET(request: Request) {
  const url = new URL(request.url); const pageId = url.searchParams.get("pageId"); let reportState: AppState = demoState; const supabase = await createClient();
  if (supabase) { const { data: { user } } = await supabase.auth.getUser(); if (!user) return new Response("Unauthorized", { status: 401 }); const { data } = await supabase.from("user_app_states").select("state").eq("user_id", user.id).maybeSingle(); if (data?.state) reportState = data.state as AppState; }
  const selected = pageId ? reportState.pages.filter((page) => page.id === pageId) : reportState.pages; const requestedWeek = url.searchParams.get("week"); const anchor = requestedWeek ? new Date(`${requestedWeek}T12:00:00`) : new Date(); const { start, end } = getWeekRange(anchor, reportState.settings.weekStartsOn);
  const document = await PDFDocument.create(); document.registerFontkit(fontkit); const fontBytes = await readFile(path.join(process.cwd(), "public", "fonts", "NotoSansArabic.ttf")); const font = await document.embedFont(fontBytes, { subset: true });
  const page = document.addPage([595, 842]); const { height } = page.getSize(); let y = height - 56; const ink = rgb(.10, .10, .11); const muted = rgb(.42, .42, .45); const lime = rgb(.50, .67, .14);
  const line = (text: string, size = 11, color = ink, gap = 22) => { if (y < 60) y = height - 56; page.drawText(text, { x: 48, y, size, font, color, maxWidth: 500 }); y -= gap; };
  line(pageId ? selected[0]?.name ?? "Routine" : "All routines", 26, ink, 34); line(`${format(start, "d MMMM yyyy")} — ${format(end, "d MMMM yyyy")}`, 11, muted, 36);
  let total = 0;
  for (const routine of selected) { line(routine.name, 16, lime, 26); if (routine.description) for (const part of routine.description.split("\n")) line(part, 10, muted, 17); for (const task of pageTasks(routine.blocks)) { line(task.title, 11, ink, 18); for (const slot of task.slots) { line(`  ${slot.label ?? "Time"}  ·  ${slot.time}  ·  Pending`, 9, muted, 16); total += 1; } } y -= 12; }
  line("Weekly summary", 15, ink, 25); line(`Completed: 0    Missed: 0    Pending: ${total}`, 10, muted, 18); line("Completion rate: 0%", 10, muted, 28); line(`Generated ${format(new Date(), "d MMM yyyy, HH:mm")}`, 8, muted, 12);
  const bytes = await document.save(); const title = pageId ? selected[0]?.name ?? "Routine" : "All-Pages"; const filename = `${safeFilename(title)}_${format(start, "yyyy-MM-dd")}_to_${format(end, "yyyy-MM-dd")}.pdf`;
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
