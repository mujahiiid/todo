"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { demoState } from "@/lib/demo-data";
import type { AppState, CompletionLog, RoutineBlock, RoutinePage, TaskStatus, UserSettings } from "@/lib/types";
import { uid } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { createSnapshot, isAppState, newestSnapshot, parseStoredSnapshot, type StateSnapshot } from "@/lib/state-storage";

type Context = {
  state: AppState; hydrated: boolean;
  addPage: (template: "blank" | "daily" | "habit", name: string) => string;
  updatePage: (id: string, patch: Partial<RoutinePage>) => void; deletePage: (id: string) => void; duplicatePage: (id: string) => void;
  reorderPages: (active: string, over: string) => void; addBlock: (pageId: string, block: RoutineBlock) => void;
  updateBlock: (pageId: string, blockId: string, patch: Partial<RoutineBlock>) => void; deleteBlock: (pageId: string, blockId: string) => void;
  reorderBlocks: (pageId: string, active: string, over: string) => void;
  setStatus: (taskId: string, date: string, slotId: string, status: TaskStatus) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
};

const AppContext = createContext<Context | null>(null);
const storageKey = "ritual-app-v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(demoState);
  const [hydrated, setHydrated] = useState(false);
  const syncUserId = useRef<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const local = parseStoredSnapshot(localStorage.getItem(storageKey));
      let selected: StateSnapshot | null = local;
      const supabase = createClient();
      if (supabase) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) console.error("[Ritual sync] Could not read the authenticated user", authError.message);
        if (user) {
          syncUserId.current = user.id;
          const { data, error } = await supabase.from("user_app_states").select("state,updated_at").eq("user_id", user.id).maybeSingle();
          if (error) console.error("[Ritual sync] Could not load cloud data", error.message);
          const remote = data && isAppState(data.state) ? createSnapshot(data.state, data.updated_at) : null;
          selected = newestSnapshot(local, remote);
          if (!selected) {
            const emptyState: AppState = { ...demoState, pages: [], logs: [], settings: { ...demoState.settings, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } };
            selected = createSnapshot(emptyState);
          }
          if (!remote || selected.updatedAt !== remote.updatedAt) {
            const { error: saveError } = await supabase.from("user_app_states").upsert({ user_id: user.id, state: selected.state, updated_at: selected.updatedAt });
            if (saveError) console.error("[Ritual sync] Could not reconcile cloud data", saveError.message);
          }
        }
      }
      selected ??= createSnapshot(demoState);
      localStorage.setItem(storageKey, JSON.stringify(selected));
      setState(selected.state); setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const snapshot = createSnapshot(state);
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
    if (!syncUserId.current) return;
    const timer = window.setTimeout(async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.from("user_app_states").upsert({ user_id: syncUserId.current, state: snapshot.state, updated_at: snapshot.updatedAt });
      if (error) console.error("[Ritual sync] Could not save cloud data", error.message);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hydrated, state]);

  const addPage = useCallback((template: "blank" | "daily" | "habit", name: string) => {
    const id = uid("page"); const created = new Date().toISOString();
    const blocks: RoutineBlock[] = template === "blank" ? [] : [{ id: uid("block"), pageId: id, type: "section", position: 0, config: { text: template === "daily" ? "Daily routine" : "Habit tracker" }, createdAt: created, updatedAt: created }];
    setState((current) => ({ ...current, pages: [...current.pages, { id, name, icon: template === "habit" ? "Target" : "NotebookTabs", color: "#bef264", position: current.pages.length, blocks }] }));
    return id;
  }, []);
  const updatePage = useCallback((id: string, patch: Partial<RoutinePage>) => setState((s) => ({ ...s, pages: s.pages.map((p) => p.id === id ? { ...p, ...patch } : p) })), []);
  const deletePage = useCallback((id: string) => setState((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== id) })), []);
  const duplicatePage = useCallback((id: string) => setState((s) => { const source = s.pages.find((p) => p.id === id); if (!source) return s; const pageId = uid("page"); const blocks = source.blocks.map((b, position) => ({ ...b, id: uid("block"), pageId, position, config: b.config.task ? { ...b.config, task: { ...b.config.task, id: uid("task"), slots: b.config.task.slots.map((slot) => ({ ...slot, id: uid("slot") })) } } : { ...b.config } })); return { ...s, pages: [...s.pages, { ...source, id: pageId, name: `${source.name} copy`, position: s.pages.length, blocks }] }; }), []);
  const reorderPages = useCallback((active: string, over: string) => setState((s) => { const oldIndex = s.pages.findIndex((p) => p.id === active); const newIndex = s.pages.findIndex((p) => p.id === over); return { ...s, pages: arrayMove(s.pages, oldIndex, newIndex).map((p, position) => ({ ...p, position })) }; }), []);
  const addBlock = useCallback((pageId: string, value: RoutineBlock) => setState((s) => ({ ...s, pages: s.pages.map((p) => p.id === pageId ? { ...p, blocks: [...p.blocks, value] } : p) })), []);
  const updateBlock = useCallback((pageId: string, blockId: string, patch: Partial<RoutineBlock>) => setState((s) => ({ ...s, pages: s.pages.map((p) => p.id === pageId ? { ...p, blocks: p.blocks.map((b) => b.id === blockId ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b) } : p) })), []);
  const deleteBlock = useCallback((pageId: string, blockId: string) => setState((s) => ({ ...s, pages: s.pages.map((p) => p.id === pageId ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) } : p) })), []);
  const reorderBlocks = useCallback((pageId: string, active: string, over: string) => setState((s) => ({ ...s, pages: s.pages.map((p) => { if (p.id !== pageId) return p; const oldIndex = p.blocks.findIndex((b) => b.id === active); const newIndex = p.blocks.findIndex((b) => b.id === over); return { ...p, blocks: arrayMove(p.blocks, oldIndex, newIndex).map((b, position) => ({ ...b, position })) }; }) })), []);
  const setStatus = useCallback((taskId: string, date: string, slotId: string, status: TaskStatus) => setState((s) => { const other = s.logs.filter((log) => !(log.taskId === taskId && log.date === date && log.slotId === slotId)); const log: CompletionLog = { taskId, date, slotId, status, completedAt: status === "completed" ? new Date().toISOString() : undefined }; return { ...s, logs: status === "pending" ? other : [...other, log] }; }), []);
  const updateSettings = useCallback((patch: Partial<UserSettings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const value = useMemo(() => ({ state, hydrated, addPage, updatePage, deletePage, duplicatePage, reorderPages, addBlock, updateBlock, deleteBlock, reorderBlocks, setStatus, updateSettings }), [state, hydrated, addPage, updatePage, deletePage, duplicatePage, reorderPages, addBlock, updateBlock, deleteBlock, reorderBlocks, setStatus, updateSettings]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useRoutine() { const value = useContext(AppContext); if (!value) throw new Error("useRoutine must be used in AppProvider"); return value; }
