-- =====================================================================
-- Документи авто (страховки, техогляд, техпаспорт…) і приватний бакет documents.
-- Файли: documents/<user_id>/<car_id>/<uuid>.<ext>
-- =====================================================================
create type public.document_type as enum
  ('osago', 'casco', 'green_card', 'tech_inspection', 'registration', 'warranty', 'other');

create table public.car_documents (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  type         public.document_type not null,
  title        text check (char_length(title) <= 100),        -- назва для типу 'other'
  number       text check (char_length(number) <= 50),
  issued_by    text check (char_length(issued_by) <= 100),
  start_date   date,
  expiry_date  date,
  cost         numeric(10, 2) check (cost >= 0),
  expense_id   uuid references public.expenses (id) on delete set null,
  file_path    text,                                           -- шлях у бакеті documents
  remind_days  smallint check (remind_days between 1 and 365), -- NULL = без нагадування
  note         text,
  created_at   timestamptz not null default now(),
  constraint car_documents_dates_chk
    check (start_date is null or expiry_date is null or expiry_date >= start_date)
);
create index car_documents_car_expiry_idx on public.car_documents (car_id, expiry_date);

alter table public.car_documents enable row level security;
create policy "car_documents: owner full access" on public.car_documents
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "storage documents: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage documents: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage documents: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage documents: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
