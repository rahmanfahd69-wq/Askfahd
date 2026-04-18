-- Food tracking log table
CREATE TABLE food_logs (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid          NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date             date          NOT NULL DEFAULT CURRENT_DATE,
  food_description text          NOT NULL,
  items            jsonb         NOT NULL DEFAULT '[]'::jsonb,
  total_calories   numeric       NOT NULL DEFAULT 0,
  total_protein    numeric       NOT NULL DEFAULT 0,
  total_carbs      numeric       NOT NULL DEFAULT 0,
  total_fat        numeric       NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX food_logs_client_date_idx ON food_logs (client_id, date DESC);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own logs
CREATE POLICY "client_own_food_logs" ON food_logs
  FOR ALL TO authenticated
  USING  (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Trainers can read their clients' logs
CREATE POLICY "trainer_read_client_food_logs" ON food_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = food_logs.client_id
        AND clients.trainer_id = auth.uid()
    )
  );

-- Admins can read all logs
CREATE POLICY "admin_read_all_food_logs" ON food_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
