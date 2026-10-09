"use client";

import { format, isToday } from "date-fns";
import type { RoutineTask } from "@/lib/types";
import { dateKey, isTaskDue, weekDays } from "@/lib/week";
import { useRoutine } from "@/components/app/app-provider";
import { StatusButton } from "@/components/app/status-button";
import { cn } from "@/lib/utils";

export function WeekTracker({ tasks }: { tasks: RoutineTask[] }) {
  const { state, setStatus } = useRoutine();
  return <div className="divide-y divide-white/[.06]">{weekDays(new Date(), state.settings.weekStartsOn).map((day) => {
    const due = tasks.flatMap((task) => isTaskDue(task.frequency, day) ? task.slots.map((slot) => ({ task, slot })) : []);
    return <section key={day.toISOString()} className={cn("grid gap-4 py-6 first:pt-2 sm:grid-cols-[120px_1fr]", isToday(day) && "relative")}>
      <div><div className={cn("text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600", isToday(day) && "text-lime-300")}>{isToday(day) ? "Today · " : ""}{format(day, "EEE")}</div><div className="mt-1 text-xl font-medium text-zinc-200">{format(day, "d MMM")}</div></div>
      <div className="space-y-2">{due.length ? due.map(({ task, slot }) => { const status = state.logs.find((log) => log.taskId === task.id && log.date === dateKey(day) && log.slotId === slot.id)?.status ?? "pending"; return <div key={`${task.id}-${slot.id}`} className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition hover:bg-white/[.025]"><StatusButton status={status} onChange={(next) => setStatus(task.id, dateKey(day), slot.id, next)} label={`${task.title} ${slot.label ?? slot.time}`} /><div className="min-w-0 flex-1"><div className={cn("text-sm text-zinc-200", status === "completed" && "text-zinc-500 line-through")}>{task.title}</div><div className="text-xs text-zinc-600">{slot.label && `${slot.label} · `}{slot.time}</div></div></div>; }) : <div className="py-2 text-sm text-zinc-700">Rest day</div>}</div>
    </section>;
  })}</div>;
}
