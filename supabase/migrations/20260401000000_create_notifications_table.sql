-- Create notifications table
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null,
  title         text not null,
  message       text not null,
  is_read       boolean not null default false,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

-- Index for fast per-user queries ordered by time
create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- Row Level Security
alter table public.notifications enable row level security;

-- Users can only see their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can mark their own notifications as read
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Service role / backend can insert notifications
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

-- Enable realtime for this table
alter publication supabase_realtime add table public.notifications;
