import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subWeeks } from "date-fns";
import type { AppState } from "@/lib/types";
import { dateKey, getWeekRange, isTaskDue, pageTasks, weekDays } from "@/lib/week";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false } }); const { data: snapshots, error } = await supabase.from("user_app_states").select("user_id,state"); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let archived = 0;
  for (const snapshot of snapshots ?? []) {
    const state = snapshot.state as AppState; const anchor = subWeeks(new Date(), 1); const { start, end } = getWeekRange(anchor, state.settings.weekStartsOn); const dates = weekDays(anchor, state.settings.weekStartsOn); let completed = 0; let missed = 0; let pending = 0;
    for (const task of state.pages.flatMap((page) => pageTasks(page.blocks))) for (const day of dates) if (isTaskDue(task.frequency, day)) for (const slot of task.slots) { const status = state.logs.find((log) => log.taskId === task.id && log.slotId === slot.id && log.date === dateKey(day))?.status ?? "pending"; if (status === "completed") completed += 1; else if (status === "missed") missed += 1; else pending += 1; }
    const total = completed + missed + pending; const { error: archiveError } = await supabase.from("weekly_archives").upsert({ user_id: snapshot.user_id, week_start: dateKey(start), week_end: dateKey(end), snapshot: state, completed, missed, pending, completion_rate: total ? Math.round(completed / total * 10_000) / 100 : 0, report_available: true }, { onConflict: "user_id,week_start", ignoreDuplicates: true });
    if (!archiveError) archived += 1;
  }
  return NextResponse.json({ ok: true, archived });
}
