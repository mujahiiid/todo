"use client";

import { Check, X } from "lucide-react";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusButton({ status, onChange, label }: { status: TaskStatus; onChange: (status: TaskStatus) => void; label: string }) {
  const next = status === "pending" ? "completed" : status === "completed" ? "missed" : "pending";
  return <button aria-label={`${label}: ${status}`} title="Click to cycle pending, completed, missed" onClick={() => onChange(next)} className={cn("grid size-8 shrink-0 place-items-center rounded-full border transition active:scale-90", status === "pending" && "border-zinc-700 hover:border-zinc-500", status === "completed" && "border-lime-300 bg-lime-300 text-zinc-950", status === "missed" && "border-red-400/60 bg-red-400/10 text-red-300")}>
    {status === "completed" && <Check className="size-4" strokeWidth={3} />}{status === "missed" && <X className="size-4" strokeWidth={2.5} />}
  </button>;
}
