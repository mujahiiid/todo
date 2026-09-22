import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { timingSafeEqual } from "node:crypto";
import type { AppState, Frequency } from "@/lib/types";

export const runtime = "nodejs";

type DueSlot = { id: string; label?: string; local_time: string; timezone: string; task: { id: string; user_id: string; title: string; frequency: Frequency } };
type Subscription = { user_id: string; endpoint: string; p256dh: string; auth: string };

function localClock(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, weekday };
}

function occurs(frequency: Frequency, date: string, weekday: number) {
  if (frequency.kind === "daily") return true;
  if (frequency.kind === "once") return frequency.date === date;
  if (frequency.kind === "weekly") return frequency.day === weekday;
  if (frequency.kind === "weekdays") return frequency.days.includes(weekday);
  const days = Math.floor((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${frequency.anchor}T12:00:00Z`).getTime()) / 86_400_000);
  return days >= 0 && days % frequency.every === 0;
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function dueOccurrence(localTime: string, clock: ReturnType<typeof localClock>) {
  const [slotHour, slotMinute] = localTime.slice(0, 5).split(":").map(Number);
  const [clockHour, clockMinute] = clock.time.split(":").map(Number);
  let delta = clockHour * 60 + clockMinute - (slotHour * 60 + slotMinute);
  let date = clock.date;
  let weekday = clock.weekday;
  if (delta < 0) {
    delta += 1_440;
    date = previousDate(date);
    weekday = (weekday + 6) % 7;
  }
  return delta < 5 ? { date, weekday } : null;
}

async function handleReminderCron(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY; const subject = process.env.VAPID_SUBJECT;
  if (!url || !key || !publicKey || !privateKey || !subject) return NextResponse.json({ error: "Supabase or VAPID is not configured" }, { status: 503 });
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: snapshots, error }, { data: rawSubscriptions }] = await Promise.all([
    supabase.from("user_app_states").select("user_id,state"),
    supabase.from("push_subscriptions").select("user_id,endpoint,p256dh,auth"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const slots: DueSlot[] = (snapshots ?? []).flatMap((snapshot) => { const state = snapshot.state as AppState; return state.pages.flatMap((page) => page.blocks.flatMap((block) => block.config.task ? block.config.task.slots.filter((slot) => slot.reminder).map((slot) => ({ id: slot.id, label: slot.label, local_time: slot.time, timezone: state.settings.timezone, task: { id: block.config.task!.id, user_id: snapshot.user_id, title: block.config.task!.title, frequency: block.config.task!.frequency } })) : [])); });
  const subscriptions = (rawSubscriptions ?? []) as Subscription[]; const now = new Date(); let sent = 0; let failed = 0;
  for (const slot of slots) {
    const clock = localClock(now, slot.timezone || "UTC");
    const occurrence = dueOccurrence(slot.local_time, clock);
    if (!occurrence || !occurs(slot.task.frequency, occurrence.date, occurrence.weekday)) continue;
    const { data: log, error: logError } = await supabase.from("notification_logs").insert({ user_id: slot.task.user_id, task_id: slot.task.id, slot_id: slot.id, occurrence_date: occurrence.date, scheduled_for: now.toISOString(), status: "sending" }).select("id").single();
    if (logError?.code === "23505") continue;
    if (logError || !log) { failed += 1; continue; }
    const targets = subscriptions.filter((subscription) => subscription.user_id === slot.task.user_id);
    const results = await Promise.allSettled(targets.map((subscription) => webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: slot.task.title, body: `${slot.label ?? "Routine"} · ${slot.local_time.slice(0, 5)}`, url: "/app" }))));
    const failures = results.filter((result) => result.status === "rejected"); failed += failures.length; sent += results.length - failures.length;
    await supabase.from("notification_logs").update({ status: failures.length ? "failed" : "sent", error: failures.length ? "One or more push endpoints rejected delivery" : null }).eq("id", log.id);
  }
  return NextResponse.json({ ok: true, sent, failed });
}

export const GET = handleReminderCron;
export const POST = handleReminderCron;
