"use client";

import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BarChart3, CalendarDays, Clock3, GripVertical, History, Menu, NotebookTabs, Plus, Settings, Sparkles, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRoutine } from "@/components/app/app-provider";
import { dictionary } from "@/lib/i18n";

const icons = { Sparkles, NotebookTabs, Target };

function PageItem({ id, name, icon, active, onSelect }: { id: string; name: string; icon: string; active: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const Icon = icons[icon as keyof typeof icons] ?? NotebookTabs;
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group flex items-center rounded-xl", active && "bg-white/[.08]")}>
    <button className="cursor-grab touch-none px-1 text-zinc-600 opacity-60 transition lg:opacity-0 lg:group-hover:opacity-100" aria-label={`Drag ${name}`} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
    <button onClick={onSelect} className="flex min-h-10 min-w-0 flex-1 items-center gap-3 px-2 text-start text-sm text-zinc-400 transition hover:text-white"><Icon className="size-4 shrink-0" /><span className="truncate">{name}</span></button>
  </div>;
}

export function Sidebar({ view, selectedPage, onNavigate, onNewPage }: { view: string; selectedPage?: string; onNavigate: (view: string, pageId?: string) => void; onNewPage: () => void }) {
  const { state, reorderPages } = useRoutine(); const t = dictionary(state.settings.locale); const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const dragEnd = ({ active, over }: DragEndEvent) => { if (over && active.id !== over.id) reorderPages(String(active.id), String(over.id)); };
  const navigate = (next: string, pageId?: string) => { onNavigate(next, pageId); setOpen(false); };
  const nav = <aside className="flex h-full w-[272px] flex-col border-e border-white/[.07] bg-[#0d0d0e] px-3 pb-4 pt-5">
    <div className="mb-6 flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-xl bg-lime-300 text-zinc-950"><Clock3 className="size-5" /></div><div><div className="font-semibold tracking-tight text-white">Ritual</div><div className="text-[11px] text-zinc-600">Make time yours.</div></div><Button className="ms-auto lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></Button></div>
    <nav className="space-y-1">
      <button onClick={() => navigate("today")} className={cn("nav-item", view === "today" && "nav-active")}><CalendarDays className="size-4" />{t.today}<span className="ms-auto rounded-full bg-lime-300/10 px-2 py-0.5 text-[10px] text-lime-300">3</span></button>
      <button onClick={() => navigate("stats")} className={cn("nav-item", view === "stats" && "nav-active")}><BarChart3 className="size-4" />{t.statistics}</button>
      <button onClick={() => navigate("history")} className={cn("nav-item", view === "history" && "nav-active")}><History className="size-4" />{t.history}</button>
    </nav>
    <div className="mt-7 flex items-center justify-between px-2"><span className="text-[11px] font-semibold uppercase tracking-[.16em] text-zinc-600">{t.pages}</span><Button size="icon" variant="ghost" className="size-8" onClick={onNewPage} aria-label={t.newPage}><Plus className="size-4" /></Button></div>
    <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
      <DndContext sensors={sensors} onDragEnd={dragEnd}><SortableContext items={state.pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>{state.pages.map((page) => <PageItem key={page.id} {...page} active={view === "page" && selectedPage === page.id} onSelect={() => navigate("page", page.id)} />)}</SortableContext></DndContext>
    </div>
    <button onClick={() => navigate("settings")} className={cn("nav-item mt-3", view === "settings" && "nav-active")}><Settings className="size-4" />{t.settings}</button>
    <div className="mt-3 flex items-center gap-3 border-t border-white/[.06] px-2 pt-4"><div className="grid size-9 place-items-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">Y</div><div className="min-w-0"><div className="truncate text-sm text-zinc-300">Your space</div><div className="truncate text-[11px] text-zinc-600">Local demo · sync ready</div></div></div>
  </aside>;
  return <><Button variant="ghost" size="icon" className="fixed start-3 top-3 z-30 bg-zinc-900/80 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></Button><div className="hidden h-dvh shrink-0 lg:block">{nav}</div>{open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><div className="h-full w-[86%] max-w-[300px]">{nav}</div></div>}</>;
}
