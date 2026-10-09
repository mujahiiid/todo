"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold text-white">{title}</h2><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-5" /></Button></div>
      {children}
    </div>
  </div>;
}
