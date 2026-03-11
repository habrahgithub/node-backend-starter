CREATE TABLE IF NOT EXISTS webhook_events_log (
  id BIGSERIAL PRIMARY KEY,
  route TEXT NOT NULL,
  action TEXT NOT NULL,
  correlation_id TEXT,
  request_method TEXT,
  response_status INTEGER,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_events_log (
  id BIGSERIAL PRIMARY KEY,
  route TEXT NOT NULL,
  action TEXT NOT NULL,
  correlation_id TEXT,
  request_method TEXT,
  response_status INTEGER,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS abuse_attempt_log (
  id BIGSERIAL PRIMARY KEY,
  route TEXT NOT NULL,
  action TEXT NOT NULL,
  correlation_id TEXT,
  request_method TEXT,
  response_status INTEGER,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION deny_mutation_on_append_only_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'append-only table: mutation denied';
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_events_log_no_update ON webhook_events_log;
DROP TRIGGER IF EXISTS trg_webhook_events_log_no_delete ON webhook_events_log;
CREATE TRIGGER trg_webhook_events_log_no_update BEFORE UPDATE ON webhook_events_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();
CREATE TRIGGER trg_webhook_events_log_no_delete BEFORE DELETE ON webhook_events_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();

DROP TRIGGER IF EXISTS trg_delivery_events_log_no_update ON delivery_events_log;
DROP TRIGGER IF EXISTS trg_delivery_events_log_no_delete ON delivery_events_log;
CREATE TRIGGER trg_delivery_events_log_no_update BEFORE UPDATE ON delivery_events_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();
CREATE TRIGGER trg_delivery_events_log_no_delete BEFORE DELETE ON delivery_events_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();

DROP TRIGGER IF EXISTS trg_abuse_attempt_log_no_update ON abuse_attempt_log;
DROP TRIGGER IF EXISTS trg_abuse_attempt_log_no_delete ON abuse_attempt_log;
CREATE TRIGGER trg_abuse_attempt_log_no_update BEFORE UPDATE ON abuse_attempt_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();
CREATE TRIGGER trg_abuse_attempt_log_no_delete BEFORE DELETE ON abuse_attempt_log
FOR EACH ROW EXECUTE FUNCTION deny_mutation_on_append_only_logs();
