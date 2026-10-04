import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }) });

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const supabase = await createClient(); if (!supabase) return NextResponse.json({ ok: true, demo: true }); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: body.data.endpoint, p256dh: body.data.keys.p256dh, auth: body.data.keys.auth }, { onConflict: "user_id,endpoint" });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
