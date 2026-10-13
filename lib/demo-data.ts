import type { AppState, RoutineBlock, RoutinePage } from "@/lib/types";

const now = new Date().toISOString();
const block = (pageId: string, id: string, type: RoutineBlock["type"], position: number, config: RoutineBlock["config"]): RoutineBlock => ({
  id, pageId, type, position, config, createdAt: now, updatedAt: now,
});

const hair: RoutinePage = {
  id: "hair", name: "Hair routine", icon: "Sparkles", color: "#a3e635", position: 0,
  description: "مينوكسيديل يومياً مرتين\nديرما مرة واحدة فقط\nنيزابكس مرة أسبوعياً",
  blocks: [
    block("hair", "hair-heading", "section", 0, { text: "Daily care" }),
    block("hair", "minoxidil", "task", 1, { task: { id: "minoxidil-task", title: "Minoxidil", description: "Apply gently to a dry scalp", frequency: { kind: "daily" }, slots: [
      { id: "minoxidil-am", time: "09:00", label: "Morning", reminder: true },
      { id: "minoxidil-pm", time: "22:00", label: "Night", reminder: true },
    ] } }),
    block("hair", "derma", "task", 2, { task: { id: "derma-task", title: "Derma roller", frequency: { kind: "weekly", day: 5 }, slots: [{ id: "derma-slot", time: "20:30", label: "Evening", reminder: true }] } }),
  ],
};

const gym: RoutinePage = {
  id: "gym", name: "Gym", icon: "Dumbbell", color: "#fb7185", position: 1,
  description: "Strength, mobility, and a little consistency.",
  blocks: [
    block("gym", "gym-section", "section", 0, { text: "Training days" }),
    block("gym", "workout", "task", 1, { task: { id: "workout-task", title: "Full body workout", frequency: { kind: "weekdays", days: [1, 3, 5] }, slots: [{ id: "workout-slot", time: "18:00", label: "Workout", reminder: true }] } }),
  ],
};

export const demoState: AppState = {
  pages: [hair, gym], logs: [],
  settings: {
    locale: "en", weekStartsOn: 6,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo",
    theme: "dark", notifications: false, weeklyReports: true, automaticReports: true, defaultPage: "today",
  },
};
