import { addDays, differenceInCalendarDays, format, parseISO, startOfDay, subDays } from "date-fns";
import type { Frequency, RoutineTask } from "@/lib/types";

export function getWeekRange(date: Date, weekStartsOn = 6) {
  const day = date.getDay();
  const offset = (day - weekStartsOn + 7) % 7;
  const start = startOfDay(subDays(date, offset));
  return { start, end: addDays(start, 6) };
}

export function weekDays(date: Date, weekStartsOn = 6) {
  const { start } = getWeekRange(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function isTaskDue(frequency: Frequency, date: Date) {
  const key = dateKey(date);
  switch (frequency.kind) {
    case "once":
      return frequency.date === key;
    case "daily":
      return true;
    case "weekdays":
      return frequency.days.includes(date.getDay());
    case "weekly":
      return frequency.day === date.getDay();
    case "interval": {
      const distance = differenceInCalendarDays(startOfDay(date), startOfDay(parseISO(frequency.anchor)));
      return distance >= 0 && distance % frequency.every === 0;
    }
  }
}

export function pageTasks(blocks: { config: { task?: RoutineTask } }[]) {
  return blocks.flatMap((block) => (block.config.task ? [block.config.task] : []));
}

export function formatWeekLabel(date: Date, weekStartsOn = 6) {
  const { start, end } = getWeekRange(date, weekStartsOn);
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}
