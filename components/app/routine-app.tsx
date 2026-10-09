"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, LayoutList, Plus, Target, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { AppProvider, useRoutine } from "@/components/app/app-provider";
import { Sidebar } from "@/components/app/sidebar";
import { PageView } from "@/components/app/page-view";
import { HistoryView, SettingsView, StatisticsView, TodayView } from "@/components/app/views";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type View = "today" | "page" | "stats" | "history" | "settings";

function NewPageModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { addPage } = useRoutine(); const [name, setName] = useState(""); const [template, setTemplate] = useState<"blank" | "daily" | "habit">("daily");
  const create = () => { const id = addPage(template, name.trim() || "Untitled routine"); setName(""); onClose(); onCreated(id); toast.success("Page created"); };
  return <Modal open={open} title="Create a page" onClose={onClose}><div className="space-y-5"><label className="field-label">Page name<input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Skin routine" /></label><div><div className="field-label mb-2">Start with</div><div className="grid gap-2 sm:grid-cols-3">{([{ id: "daily", label: "Daily routine", Icon: LayoutList }, { id: "habit", label: "Habit tracker", Icon: Target }, { id: "blank", label: "Blank page", Icon: FileText }] as const).map(({ id, label, Icon }) => <button key={id} onClick={() => setTemplate(id)} className={`rounded-2xl border p-4 text-start transition ${template === id ? "border-lime-300/50 bg-lime-300/[.06]" : "border-white/[.07] hover:bg-white/[.03]"}`}><Icon className={`size-5 ${template === id ? "text-lime-300" : "text-zinc-600"}`} /><div className="mt-5 text-sm text-zinc-300">{label}</div></button>)}</div></div><Button className="w-full" onClick={create}><Plus className="size-4" />Create page</Button></div></Modal>;
}

function Shell() {
  const { state, deletePage, duplicatePage } = useRoutine(); const [view, setView] = useState<View>("today"); const [selectedPage, setSelectedPage] = useState<string | undefined>(state.pages[0]?.id); const [newOpen, setNewOpen] = useState(false); const page = state.pages.find((item) => item.id === selectedPage);
  useEffect(() => { document.documentElement.dir = state.settings.locale === "ar" ? "rtl" : "ltr"; document.documentElement.lang = state.settings.locale; document.documentElement.classList.toggle("light", state.settings.theme === "light"); }, [state.settings.locale, state.settings.theme]);
  const navigate = (next: string, pageId?: string) => { setView(next as View); if (pageId) setSelectedPage(pageId); };
  return <div className="flex min-h-dvh bg-[#0a0a0b] text-zinc-100"><Sidebar view={view} selectedPage={selectedPage} onNavigate={navigate} onNewPage={() => setNewOpen(true)} /><div className="min-w-0 flex-1">{view === "today" && <TodayView />}{view === "stats" && <StatisticsView />}{view === "history" && <HistoryView />}{view === "settings" && <SettingsView />}{view === "page" && page && <><PageView page={page} /><div className="fixed bottom-4 end-4 hidden gap-2 sm:flex"><Button variant="outline" size="sm" onClick={() => { duplicatePage(page.id); toast.success("Page duplicated"); }}><Copy className="size-3.5" />Duplicate</Button><Button variant="danger" size="sm" onClick={() => { if (confirm(`Delete “${page.name}”? This cannot be undone.`)) { deletePage(page.id); setView("today"); toast.success("Page deleted"); } }}><Trash2 className="size-3.5" />Delete</Button></div></>}</div><NewPageModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => { setSelectedPage(id); setView("page"); }} /><Toaster theme="dark" position="bottom-center" richColors /></div>;
}

export function RoutineApp() { return <AppProvider><Shell /></AppProvider>; }
