### Core idea

You are building **time-based triggers + state tracking + notification delivery**. Break it into 4 independent layers:

---

# 1. Database Design (Supabase)

### `policies` table

```sql
id (uuid)
customer_name (text)
renewal_date (timestamp)
status (text) -- contacted, in-discussion, renewed, closed
created_at
```

### `reminder_settings` table (per policy)

```sql
id (uuid)
policy_id (uuid, fk)
days_before (int) -- 30, 7, 3, 2, 1
enabled (boolean)
```

### `reminders_log` table (important)

```sql
id (uuid)
policy_id (uuid)
scheduled_for (timestamp)
sent (boolean)
sent_at (timestamp)
type (text) -- reminder / status_update
```

Purpose:

* Prevent duplicate notifications
* Track what was already sent

---

# 2. UI (React)

### Checkbox UI

When user selects:

* 30 days
* 7 days
* etc.

You store rows in `reminder_settings`.

Example payload:

```json
[
  { "policy_id": "123", "days_before": 30, "enabled": true },
  { "policy_id": "123", "days_before": 7, "enabled": true }
]
```

---

# 3. Scheduler (Most Important Part)

Supabase **does NOT run cron automatically like a backend server**, so you need one of these:

## Option A (Recommended): Supabase Edge Function + CRON

### Step:

* Create Edge Function: `check-reminders`
* Use Supabase cron (pg_cron or external cron like GitHub Actions / server)

---

### Logic inside function

Pseudo:

```ts
1. Get today's date

2. Fetch all policies where:
   renewal_date IS NOT NULL

3. For each policy:
   - Get its reminder_settings

4. For each setting:
   reminder_date = renewal_date - days_before

   IF reminder_date == today:
      check reminders_log:
         if not already sent:
            send notification
            insert into reminders_log
```

---

### SQL to help

```sql
SELECT p.id, p.renewal_date, rs.days_before
FROM policies p
JOIN reminder_settings rs ON rs.policy_id = p.id
WHERE rs.enabled = true;
```

Then calculate in code.

---

# 4. Notification Layer

Pick one:

### Simple:

* Email (Resend / SMTP)
* WhatsApp (Twilio)
* Push (if app)

Example:

```ts
await sendEmail({
  to: customer.email,
  subject: "Policy Renewal Reminder",
  text: `Your policy expires in ${days_before} days`
})
```

---

# 5. Status-based triggers

When status changes:

### React side

```ts
updatePolicyStatus(policy_id, "renewed")
```

### Add hook:

* Either DB trigger
* Or handle in frontend/backend

---

### Option (clean):

Use Supabase DB trigger:

```sql
CREATE OR REPLACE FUNCTION handle_status_change()
RETURNS trigger AS $$
BEGIN
  INSERT INTO reminders_log (policy_id, type, scheduled_for)
  VALUES (NEW.id, 'status_update', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER status_change_trigger
AFTER UPDATE ON policies
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION handle_status_change();
```

---

# 6. Avoid duplicate reminders

Before sending:

```ts
SELECT * FROM reminders_log
WHERE policy_id = X
AND scheduled_for = today
```

If exists → skip

---

# 7. Cron Setup Options

### Option 1: Supabase pg_cron

```sql
SELECT cron.schedule(
  'daily-reminder',
  '0 9 * * *',
  $$ SELECT net.http_post(
    url:='https://your-edge-function-url',
    headers:='{"Authorization": "Bearer YOUR_KEY"}'
  ); $$
);
```

### Option 2: External (simpler mentally)

* GitHub Actions (daily)
* or small Node server with `node-cron`

---

# Flow Summary

```
User selects reminder days →
Stored in DB →

Daily cron runs →
Checks today's reminders →
Matches renewal_date - days_before →
If match →
Send notification →
Log it →
```

---

# What will break if done wrong

* No `reminders_log` → duplicate spam
* No cron → nothing triggers
* Doing logic in frontend → unreliable
* Not handling timezone → wrong day trigger

---

# Minimal working version (fast build)

1. policies table
2. reminder_settings table
3. Edge function (daily run)
4. Email sending
5. reminders_log (must)

---

# Optional improvements

* Add `next_reminder_date` (precomputed → faster queries)
* Queue system (if scaling)
* Retry mechanism for failed sends

---

# Missing decisions (critical)

* Notification type (email / whatsapp / both)
* Timezone (IST vs user-specific)
* Multi-user dashboard or single admin

Without locking these, implementation will drift.
