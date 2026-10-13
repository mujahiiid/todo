export type Locale = "en" | "ar";
export type Theme = "system" | "light" | "dark";
export type TaskStatus = "completed" | "missed" | "pending";
export type Frequency =
  | { kind: "once"; date: string }
  | { kind: "daily" }
  | { kind: "weekdays"; days: number[] }
  | { kind: "weekly"; day: number }
  | { kind: "interval"; every: number; anchor: string };

export interface TaskSlot {
  id: string;
  time: string;
  label?: string;
  reminder: boolean;
}

export interface RoutineTask {
  id: string;
  title: string;
  description?: string;
  frequency: Frequency;
  slots: TaskSlot[];
}

export type BlockType = "heading" | "text" | "divider" | "spacer" | "task" | "section";

export interface RoutineBlock {
  id: string;
  pageId: string;
  type: BlockType;
  position: number;
  config: { text?: string; task?: RoutineTask };
  createdAt: string;
  updatedAt: string;
}

export interface RoutinePage {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  position: number;
  blocks: RoutineBlock[];
}

export interface CompletionLog {
  taskId: string;
  date: string;
  slotId: string;
  status: TaskStatus;
  completedAt?: string;
}

export interface UserSettings {
  locale: Locale;
  weekStartsOn: number;
  timezone: string;
  theme: Theme;
  notifications: boolean;
  weeklyReports: boolean;
  automaticReports: boolean;
  defaultPage: "today" | string;
}

export interface AppState {
  pages: RoutinePage[];
  logs: CompletionLog[];
  settings: UserSettings;
}
