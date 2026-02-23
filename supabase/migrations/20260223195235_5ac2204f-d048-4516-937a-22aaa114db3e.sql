
-- Schedule auto-credit loyalty cron job every 5 minutes
SELECT cron.schedule(
  'auto-credit-loyalty',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bnaqcsjummrfdwdmppkm.supabase.co/functions/v1/auto-credit-loyalty',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXFjc2p1bW1yZmR3ZG1wcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDI1MjMsImV4cCI6MjA3ODIxODUyM30.2XQXXGxEBQib2Mr1RTIbpud5ezIzWB_bNUfV9_g43FE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
