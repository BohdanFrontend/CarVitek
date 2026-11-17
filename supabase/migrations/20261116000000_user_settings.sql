-- =====================================================================
-- Налаштування користувача: мова, валюта, нагадування
-- Рядка може ще не бути — застосунок тоді бере значення за замовчуванням,
-- а збереження робить upsert.
-- =====================================================================
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  language text not null default 'en' check (language in ('en', 'uk')),
  currency text not null default 'UAH' check (currency in ('UAH', 'USD', 'EUR')),
  email_reminders boolean not null default true,
  browser_notifications boolean not null default false,
  remind_when text not null default 'due_soon' check (remind_when in ('due_soon', 'overdue')),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings: select own" on public.user_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_settings: insert own" on public.user_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_settings: update own" on public.user_settings
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
