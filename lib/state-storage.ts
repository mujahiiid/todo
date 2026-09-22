import type { AppState } from "@/lib/types";

export interface StateSnapshot {
  version: 2;
  updatedAt: string;
  state: AppState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAppState(value: unknown): value is AppState {
  return isRecord(value) && Array.isArray(value.pages) && Array.isArray(value.logs) && isRecord(value.settings);
}

export function parseStoredSnapshot(raw: string | null, migratedAt = new Date().toISOString()): StateSnapshot | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && parsed.version === 2 && typeof parsed.updatedAt === "string" && isAppState(parsed.state)) {
      return parsed as unknown as StateSnapshot;
    }
    if (isAppState(parsed)) return { version: 2, updatedAt: migratedAt, state: parsed };
  } catch { /* ignore invalid browser storage */ }
  return null;
}

export function createSnapshot(state: AppState, updatedAt = new Date().toISOString()): StateSnapshot {
  return { version: 2, updatedAt, state };
}

export function newestSnapshot(local: StateSnapshot | null, remote: StateSnapshot | null) {
  if (!local) return remote;
  if (!remote) return local;
  return Date.parse(remote.updatedAt) > Date.parse(local.updatedAt) ? remote : local;
}
