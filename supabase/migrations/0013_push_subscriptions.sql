-- Suscripciones push para notificaciones Web Push (RFC 8030 + VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede ver sus suscripciones
CREATE POLICY "select_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el propio usuario puede registrar sus suscripciones
CREATE POLICY "insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el propio usuario puede eliminar sus suscripciones
CREATE POLICY "delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
