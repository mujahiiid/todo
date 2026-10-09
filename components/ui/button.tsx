import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline" | "danger"; size?: "default" | "icon" | "sm" };

export function Button({ className, variant = "default", size = "default", ...props }: Props) {
  return <button className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-lime-400/70 disabled:pointer-events-none disabled:opacity-50", {
    "bg-lime-300 text-zinc-950 hover:bg-lime-200": variant === "default",
    "text-zinc-400 hover:bg-white/6 hover:text-white": variant === "ghost",
    "border border-white/10 bg-white/[.03] text-zinc-200 hover:bg-white/[.07]": variant === "outline",
    "bg-red-500/12 text-red-300 hover:bg-red-500/20": variant === "danger",
    "px-4 py-2": size === "default", "size-10 p-0": size === "icon", "min-h-9 px-3 py-1.5 text-xs": size === "sm",
  }, className)} {...props} />;
}
