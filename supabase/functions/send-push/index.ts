import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    console.error("VAPID secrets not configured");
    return new Response(JSON.stringify({ error: "VAPID secrets not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const record = body.record ?? body;

  if (!record?.user_id) {
    return new Response(JSON.stringify({ error: "Missing user_id" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: subscriptions, error: dbError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", record.user_id);

  if (dbError) {
    console.error("DB error:", dbError);
    return new Response(JSON.stringify({ error: dbError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!subscriptions?.length) {
    console.log("No subscriptions for user:", record.user_id);
    return new Response(JSON.stringify({ message: "No subscriptions" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title: "OpenGig",
    body: record.message ?? "Tienes una nueva notificación.",
    url: "/me/calendar",
    icon: "/OpenGig_favicon.svg",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  console.log("Push results:", JSON.stringify(results));

  return new Response(JSON.stringify({ ok: true, sent: subscriptions.length }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
