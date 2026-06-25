// Edge Function: se invoca mediante un Database Webhook en la tabla `notifications` (INSERT)
// Configurar en Supabase Dashboard → Database → Webhooks → Create Webhook
//   Table: notifications | Events: INSERT | URL: {project_url}/functions/v1/send-push

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL")!;

Deno.serve(async (req: Request) => {
  const { record } = await req.json();

  if (!record?.user_id) {
    return new Response("Missing user_id", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", record.user_id);

  if (!subscriptions?.length) {
    return new Response("No subscriptions", { status: 200 });
  }

  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title: "OpenGig",
    body: record.message ?? "Tienes una nueva notificación.",
    url: "/me/calendar",
    icon: "/OpenGig_favicon.svg",
  });

  await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  return new Response("OK", { status: 200 });
});
