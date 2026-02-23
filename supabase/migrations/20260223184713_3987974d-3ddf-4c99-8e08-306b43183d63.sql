SELECT cron.schedule(
  'rating-reminders-daily',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url:='https://bnaqcsjummrfdwdmppkm.supabase.co/functions/v1/rating-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXFjc2p1bW1yZmR3ZG1wcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDI1MjMsImV4cCI6MjA3ODIxODUyM30.2XQXXGxEBQib2Mr1RTIbpud5ezIzWB_bNUfV9_g43FE"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);