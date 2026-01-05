-- Schedule booking reminders to run every 5 minutes
SELECT cron.schedule(
  'booking-reminders-check',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://bnaqcsjummrfdwdmppkm.supabase.co/functions/v1/booking-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXFjc2p1bW1yZmR3ZG1wcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDI1MjMsImV4cCI6MjA3ODIxODUyM30.2XQXXGxEBQib2Mr1RTIbpud5ezIzWB_bNUfV9_g43FE"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule inactive users reminder to run once a week (Mondays at 10:00 AM)
SELECT cron.schedule(
  'inactive-users-reminder-weekly',
  '0 10 * * 1',
  $$
  SELECT net.http_post(
    url:='https://bnaqcsjummrfdwdmppkm.supabase.co/functions/v1/inactive-users-reminder',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXFjc2p1bW1yZmR3ZG1wcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDI1MjMsImV4cCI6MjA3ODIxODUyM30.2XQXXGxEBQib2Mr1RTIbpud5ezIzWB_bNUfV9_g43FE"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);