import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Ritual — Routine Tracker", short_name: "Ritual", description: "Calm, flexible routines that fit your life.", start_url: "/app", display: "standalone", background_color: "#0a0a0b", theme_color: "#0a0a0b", orientation: "portrait", icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }] };
}
