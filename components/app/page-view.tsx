"use client";

import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useRoutine } from "@/components/app/app-provider";
import { WeekTracker } from "@/components/app/week-tracker";
import type { RoutineBlock, RoutinePage } from "@/lib/types";
import { formatWeekLabel, pageTasks } from "@/lib/week";
import { cn, uid } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, "Add a title"), description: z.string().optional(), frequency: z.enum(["daily", "weekdays", "weekly"]),
  weekdays: z.array(z.boolean()).length(7), slots: z.array(z.object({ label: z.string(), time: z.string().min(1), reminder: z.boolean() })).min(1),
});
type TaskForm = z.infer<typeof taskSchema>;

function SortableBlock({ block, children, onDelete }: { block: RoutineBlock; children: React.ReactNode; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group relative", isDragging && "z-20 opacity-60")}>
    <div className="absolute end-0 top-0 z-10 flex items-center rounded-lg bg-[#0a0a0b]/90 lg:-start-10 lg:end-auto lg:bg-transparent lg:opacity-0 lg:group-hover:opacity-100"><button className="cursor-grab touch-none p-2 text-zinc-600 hover:text-zinc-300" {...attributes} {...listeners} aria-label="Drag block"><GripVertical className="size-4" /></button><button className="p-2 text-zinc-700 hover:text-red-300" onClick={onDelete} aria-label="Delete block"><Trash2 className="size-3.5" /></button></div>{children}
  </div>;
}

function TaskModal({ page, open, onClose }: { page: RoutinePage; open: boolean; onClose: () => void }) {
  const { addBlock } = useRoutine(); const { register, control, handleSubmit, formState: { errors } } = useForm<TaskForm>({ resolver: zodResolver(taskSchema), defaultValues: { title: "", description: "", frequency: "daily", weekdays: [false, true, false, true, false, true, false], slots: [{ label: "Morning", time: "09:00", reminder: true }] } });
  const { fields, append, remove } = useFieldArray({ control, name: "slots" });
  const submit = (values: TaskForm) => { const id = uid("block"); const created = new Date().toISOString(); const days = values.weekdays.flatMap((enabled, day) => enabled ? [day] : []); addBlock(page.id, { id, pageId: page.id, type: "task", position: page.blocks.length, createdAt: created, updatedAt: created, config: { task: { id: uid("task"), title: values.title, description: values.description, frequency: values.frequency === "daily" ? { kind: "daily" } : values.frequency === "weekly" ? { kind: "weekly", day: days[0] ?? 6 } : { kind: "weekdays", days }, slots: values.slots.map((slot) => ({ ...slot, id: uid("slot") })) } } }); onClose(); };
  return <Modal open={open} title="New task" onClose={onClose}><form onSubmit={handleSubmit(submit)} className="space-y-5">
    <label className="field-label">Task name<input className="input" placeholder="e.g. Minoxidil" {...register("title")} />{errors.title && <span className="text-xs text-red-300">{errors.title.message}</span>}</label>
    <label className="field-label">Description<textarea className="input min-h-20 resize-none" placeholder="Optional note" {...register("description")} /></label>
    <label className="field-label">Frequency<select className="input" {...register("frequency")}><option value="daily">Every day</option><option value="weekdays">Specific weekdays</option><option value="weekly">Once a week</option></select></label>
    <fieldset><legend className="field-label mb-2">Days</legend><div className="grid grid-cols-7 gap-1">{"SMTWTFS".split("").map((day, index) => <label key={index} className="grid cursor-pointer place-items-center gap-1 text-[10px] text-zinc-500"><span>{day}</span><input type="checkbox" className="size-5 accent-lime-300" {...register(`weekdays.${index}`)} /></label>)}</div></fieldset>
    <fieldset><div className="mb-2 flex items-center justify-between"><legend className="field-label">Time slots</legend><Button type="button" size="sm" variant="ghost" onClick={() => append({ label: "", time: "12:00", reminder: true })}><Plus className="size-3.5" />Add time</Button></div><div className="space-y-2">{fields.map((field, index) => <div key={field.id} className="grid grid-cols-[1fr_110px_36px] gap-2"><input className="input" placeholder="Label" {...register(`slots.${index}.label`)} /><input className="input" type="time" {...register(`slots.${index}.time`)} /><Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(index)} aria-label="Remove time"><Trash2 className="size-4" /></Button></div>)}</div></fieldset>
    <Button className="w-full" type="submit">Create task</Button>
  </form></Modal>;
}

export function PageView({ page }: { page: RoutinePage }) {
  const { updatePage, deleteBlock, addBlock, reorderBlocks } = useRoutine(); const [taskOpen, setTaskOpen] = useState(false); const [editing, setEditing] = useState(false); const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const tasks = pageTasks(page.blocks); const dragEnd = ({ active, over }: DragEndEvent) => { if (over && active.id !== over.id) reorderBlocks(page.id, String(active.id), String(over.id)); };
  const addText = (type: "text" | "section" | "divider" | "spacer") => { const created = new Date().toISOString(); addBlock(page.id, { id: uid("block"), pageId: page.id, type, position: page.blocks.length, config: type === "section" ? { text: "New section" } : type === "text" ? { text: "Write a note…" } : {}, createdAt: created, updatedAt: created }); };
  return <div className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-20 sm:px-8 lg:pt-12">
    <header className="mb-9"><div className="mb-4 flex items-start gap-3"><div className="min-w-0 flex-1">{editing ? <input autoFocus className="w-full bg-transparent text-4xl font-semibold tracking-[-.035em] text-white outline-none sm:text-5xl" value={page.name} onChange={(e) => updatePage(page.id, { name: e.target.value })} onBlur={() => setEditing(false)} /> : <h1 className="text-4xl font-semibold tracking-[-.035em] text-white sm:text-5xl">{page.name}</h1>}<div className="mt-3 text-sm text-zinc-600">{formatWeekLabel(new Date())}</div></div><Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Rename page"><Pencil className="size-4" /></Button><a href={`/api/reports?scope=page&pageId=${page.id}`} target="_blank" rel="noreferrer"><Button variant="outline" size="icon" aria-label="Download report"><Download className="size-4" /></Button></a><Button variant="ghost" size="icon" aria-label="More options"><MoreHorizontal className="size-5" /></Button></div>
      <textarea value={page.description ?? ""} onChange={(event) => updatePage(page.id, { description: event.target.value })} placeholder="Add a description…" className="min-h-16 w-full resize-none bg-transparent text-[15px] leading-7 text-zinc-500 outline-none placeholder:text-zinc-800" />
    </header>
    <DndContext sensors={sensors} onDragEnd={dragEnd}><SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}><div className="space-y-4">{page.blocks.filter((b) => b.type !== "task").map((block) => <SortableBlock key={block.id} block={block} onDelete={() => deleteBlock(page.id, block.id)}>{block.type === "divider" ? <hr className="border-white/[.07]" /> : block.type === "spacer" ? <div className="h-8" /> : block.type === "section" ? <input className="w-full bg-transparent text-xs font-semibold uppercase tracking-[.18em] text-zinc-500 outline-none" value={block.config.text ?? ""} onChange={(e) => updatePage(page.id, { blocks: page.blocks.map((b) => b.id === block.id ? { ...b, config: { text: e.target.value } } : b) })} /> : <textarea className="w-full resize-none bg-transparent text-sm leading-7 text-zinc-400 outline-none" value={block.config.text ?? ""} onChange={(e) => updatePage(page.id, { blocks: page.blocks.map((b) => b.id === block.id ? { ...b, config: { text: e.target.value } } : b) })} />}</SortableBlock>)}</div></SortableContext></DndContext>
    {page.blocks.some((block) => block.type === "task") && <DndContext sensors={sensors} onDragEnd={dragEnd}><SortableContext items={page.blocks.filter((block) => block.type === "task").map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="mb-7 space-y-2">{page.blocks.filter((block) => block.type === "task").map((block) => <SortableBlock key={block.id} block={block} onDelete={() => deleteBlock(page.id, block.id)}><div className="rounded-xl border border-white/[.06] px-4 py-3 pe-24"><div className="text-sm text-zinc-300">{block.config.task?.title}</div><div className="mt-1 text-xs text-zinc-700">{block.config.task?.slots.length} time {block.config.task?.slots.length === 1 ? "slot" : "slots"} · drag to reorder</div></div></SortableBlock>)}</div></SortableContext></DndContext>}
    <div className="my-7 h-px bg-white/[.07]" /><WeekTracker tasks={tasks} />
    <div className="mt-8 flex flex-wrap gap-2"><Button onClick={() => setTaskOpen(true)}><Plus className="size-4" />Add task</Button><Button variant="outline" onClick={() => addText("section")}>Section</Button><Button variant="outline" onClick={() => addText("text")}>Text</Button><Button variant="outline" onClick={() => addText("divider")}>Divider</Button></div>
    <TaskModal page={page} open={taskOpen} onClose={() => setTaskOpen(false)} />
  </div>;
}
