-- =====================================================================
-- CarVitex — початкова схема БД
-- Сервісна книжка автомобіля з автоматизованим плануванням ТО
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Переліки (enum)
-- ---------------------------------------------------------------------
create type public.engine_type as enum ('petrol', 'diesel', 'lpg', 'hybrid', 'electric');

create type public.expense_category as enum (
  'repair',      -- ремонт поза планом
  'insurance',   -- страховка
  'wash',        -- мийка
  'parking',     -- паркування
  'tax',         -- податки, збори
  'fine',        -- штрафи
  'other'
);

create type public.mileage_source as enum ('manual', 'service', 'fuel', 'car_created');

-- ---------------------------------------------------------------------
-- 2. Автомобілі (гараж користувача)
-- ---------------------------------------------------------------------
create table public.cars (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid()
                     references auth.users (id) on delete cascade,
  make             text not null check (char_length(make) between 1 and 50),
  model            text not null check (char_length(model) between 1 and 50),
  year             smallint check (year between 1950 and 2100),
  engine_type      public.engine_type not null,
  plate_number     text check (char_length(plate_number) <= 15),
  vin              text check (char_length(vin) = 17),
  current_mileage  integer not null default 0 check (current_mileage >= 0),
  photo_path       text,                       -- шлях у бакеті car-photos
  created_at       timestamptz not null default now()
);

create index cars_owner_id_idx on public.cars (owner_id);

-- ---------------------------------------------------------------------
-- 3. Довідник типів робіт ТО
--    owner_id IS NULL  → системний запис (бачать усі)
--    owner_id = user   → власний тип користувача
-- ---------------------------------------------------------------------
create table public.maintenance_types (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references auth.users (id) on delete cascade,
  code             text unique,                -- стабільний ключ для системних типів
  name             text not null check (char_length(name) between 1 and 100),
  description      text,
  interval_km      integer check (interval_km > 0),
  interval_months  smallint check (interval_months > 0),
  engine_types     public.engine_type[],       -- NULL = підходить для всіх двигунів
  sort_order       smallint not null default 100,
  created_at       timestamptz not null default now(),
  constraint maintenance_types_interval_chk
    check (interval_km is not null or interval_months is not null)
);

create index maintenance_types_owner_id_idx on public.maintenance_types (owner_id);

-- ---------------------------------------------------------------------
-- 4. Індивідуальні інтервали для конкретного авто
--    NULL в інтервалі = використовувати значення з довідника
-- ---------------------------------------------------------------------
create table public.car_maintenance_rules (
  car_id               uuid not null references public.cars (id) on delete cascade,
  maintenance_type_id  uuid not null references public.maintenance_types (id) on delete cascade,
  interval_km          integer check (interval_km > 0),
  interval_months      smallint check (interval_months > 0),
  is_enabled           boolean not null default true,  -- false = не відстежувати
  primary key (car_id, maintenance_type_id)
);

create index car_maintenance_rules_type_idx on public.car_maintenance_rules (maintenance_type_id);

-- ---------------------------------------------------------------------
-- 5. Журнал обслуговування
--    service_records       — один візит (дата, пробіг, вартість, СТО)
--    service_record_items  — які саме роботи виконано під час візиту
-- ---------------------------------------------------------------------
create table public.service_records (
  id               uuid primary key default gen_random_uuid(),
  car_id           uuid not null references public.cars (id) on delete cascade,
  performed_at     date not null,
  mileage          integer not null check (mileage >= 0),
  title            text check (char_length(title) <= 120),
  labor_cost       numeric(10, 2) not null default 0 check (labor_cost >= 0),
  parts_cost       numeric(10, 2) not null default 0 check (parts_cost >= 0),
  total_cost       numeric(10, 2) generated always as (labor_cost + parts_cost) stored,
  service_station  text check (char_length(service_station) <= 120),
  comment          text,
  receipt_path     text,                       -- шлях у бакеті receipts
  created_at       timestamptz not null default now()
);

create index service_records_car_date_idx on public.service_records (car_id, performed_at desc);

create table public.service_record_items (
  service_record_id    uuid not null references public.service_records (id) on delete cascade,
  maintenance_type_id  uuid not null references public.maintenance_types (id) on delete restrict,
  primary key (service_record_id, maintenance_type_id)
);

create index service_record_items_type_idx on public.service_record_items (maintenance_type_id);

-- ---------------------------------------------------------------------
-- 6. Журнал заправок
-- ---------------------------------------------------------------------
create table public.fuel_records (
  id               uuid primary key default gen_random_uuid(),
  car_id           uuid not null references public.cars (id) on delete cascade,
  filled_at        date not null,
  mileage          integer not null check (mileage >= 0),
  liters           numeric(7, 2) not null check (liters > 0),
  price_per_liter  numeric(8, 2) not null check (price_per_liter >= 0),
  total_cost       numeric(10, 2) generated always as (round(liters * price_per_liter, 2)) stored,
  is_full_tank     boolean not null default true,
  station          text check (char_length(station) <= 120),
  created_at       timestamptz not null default now()
);

create index fuel_records_car_mileage_idx on public.fuel_records (car_id, mileage);

-- ---------------------------------------------------------------------
-- 7. Інші витрати
-- ---------------------------------------------------------------------
create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  spent_at     date not null,
  category     public.expense_category not null,
  amount       numeric(10, 2) not null check (amount >= 0),
  mileage      integer check (mileage >= 0),
  comment      text,
  created_at   timestamptz not null default now()
);

create index expenses_car_date_idx on public.expenses (car_id, spent_at desc);

-- ---------------------------------------------------------------------
-- 8. Історія пробігу (для прогнозу середнього пробігу за день)
-- ---------------------------------------------------------------------
create table public.mileage_entries (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  recorded_at  date not null default current_date,
  mileage      integer not null check (mileage >= 0),
  source       public.mileage_source not null default 'manual',
  created_at   timestamptz not null default now()
);

create index mileage_entries_car_date_idx on public.mileage_entries (car_id, recorded_at);

-- =====================================================================
-- 9. Тригери: автоматичний облік пробігу
-- =====================================================================

-- Новий запис пробігу піднімає cars.current_mileage (ніколи не зменшує)
create function public.sync_car_current_mileage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.cars
     set current_mileage = greatest(current_mileage, new.mileage)
   where id = new.car_id;
  return new;
end;
$$;

create trigger mileage_entries_sync_car
  after insert on public.mileage_entries
  for each row execute function public.sync_car_current_mileage();

-- Запис ТО або заправки автоматично потрапляє в історію пробігу
create function public.log_mileage_from_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'service_records' then
    insert into public.mileage_entries (car_id, recorded_at, mileage, source)
    values (new.car_id, new.performed_at, new.mileage, 'service');
  else
    insert into public.mileage_entries (car_id, recorded_at, mileage, source)
    values (new.car_id, new.filled_at, new.mileage, 'fuel');
  end if;
  return new;
end;
$$;

create trigger service_records_log_mileage
  after insert on public.service_records
  for each row execute function public.log_mileage_from_record();

create trigger fuel_records_log_mileage
  after insert on public.fuel_records
  for each row execute function public.log_mileage_from_record();

-- Початковий пробіг нового авто — перша точка історії
create function public.log_initial_car_mileage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mileage_entries (car_id, recorded_at, mileage, source)
  values (new.id, current_date, new.current_mileage, 'car_created');
  return new;
end;
$$;

create trigger cars_log_initial_mileage
  after insert on public.cars
  for each row execute function public.log_initial_car_mileage();

-- =====================================================================
-- 10. Row Level Security: кожен користувач бачить лише свої дані
-- =====================================================================

-- Допоміжна функція: чи належить авто поточному користувачу
create function public.is_car_owner(p_car_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cars
     where id = p_car_id
       and owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_car_owner(uuid) from public, anon;
grant execute on function public.is_car_owner(uuid) to authenticated;

alter table public.cars                  enable row level security;
alter table public.maintenance_types     enable row level security;
alter table public.car_maintenance_rules enable row level security;
alter table public.service_records       enable row level security;
alter table public.service_record_items  enable row level security;
alter table public.fuel_records          enable row level security;
alter table public.expenses              enable row level security;
alter table public.mileage_entries       enable row level security;

-- cars
create policy "cars: owner can select" on public.cars
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "cars: owner can insert" on public.cars
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "cars: owner can update" on public.cars
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "cars: owner can delete" on public.cars
  for delete to authenticated using (owner_id = (select auth.uid()));

-- maintenance_types: системні читають усі, власні — лише автор
create policy "maintenance_types: read system and own" on public.maintenance_types
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));
create policy "maintenance_types: insert own" on public.maintenance_types
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "maintenance_types: update own" on public.maintenance_types
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "maintenance_types: delete own" on public.maintenance_types
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Дочірні таблиці авто: доступ, якщо авто належить користувачу
create policy "car_maintenance_rules: owner full access" on public.car_maintenance_rules
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

create policy "service_records: owner full access" on public.service_records
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

create policy "service_record_items: owner full access" on public.service_record_items
  for all to authenticated
  using (exists (
    select 1 from public.service_records sr
     where sr.id = service_record_id and public.is_car_owner(sr.car_id)
  ))
  with check (exists (
    select 1 from public.service_records sr
     where sr.id = service_record_id and public.is_car_owner(sr.car_id)
  ));

create policy "fuel_records: owner full access" on public.fuel_records
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

create policy "expenses: owner full access" on public.expenses
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

create policy "mileage_entries: owner full access" on public.mileage_entries
  for all to authenticated
  using (public.is_car_owner(car_id))
  with check (public.is_car_owner(car_id));

-- =====================================================================
-- 11. Storage: фото авто і фото чеків (приватні бакети)
--     Шлях файлу: <user_id>/<car_id>/<файл>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('car-photos', 'car-photos', false, 5242880,
     array['image/jpeg', 'image/png', 'image/webp']),
  ('receipts',   'receipts',   false, 10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "storage: users read own files" on storage.objects
  for select to authenticated
  using (bucket_id in ('car-photos', 'receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage: users upload own files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('car-photos', 'receipts')
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage: users update own files" on storage.objects
  for update to authenticated
  using (bucket_id in ('car-photos', 'receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage: users delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('car-photos', 'receipts')
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =====================================================================
-- 12. Довідник типових робіт (системні записи)
--     Інтервали орієнтовні; користувач змінює їх під своє авто
-- =====================================================================
insert into public.maintenance_types
  (code, name, interval_km, interval_months, engine_types, sort_order)
values
  ('engine_oil',      'Заміна моторної оливи та оливного фільтра', 10000, 12,
     array['petrol','diesel','lpg','hybrid']::public.engine_type[], 10),
  ('air_filter',      'Заміна повітряного фільтра',                20000, 24,
     array['petrol','diesel','lpg','hybrid']::public.engine_type[], 20),
  ('cabin_filter',    'Заміна салонного фільтра',                  15000, 12, null, 30),
  ('fuel_filter',     'Заміна паливного фільтра',                  40000, 48,
     array['petrol','diesel','lpg','hybrid']::public.engine_type[], 40),
  ('lpg_filters',     'Заміна фільтрів ГБО',                       10000, 12,
     array['lpg']::public.engine_type[], 45),
  ('spark_plugs',     'Заміна свічок запалювання',                 30000, 36,
     array['petrol','lpg','hybrid']::public.engine_type[], 50),
  ('brake_pads',      'Заміна гальмівних колодок',                 30000, null, null, 60),
  ('brake_fluid',     'Заміна гальмівної рідини',                  null,  24, null, 70),
  ('coolant',         'Заміна охолоджувальної рідини',             60000, 48, null, 80),
  ('timing_belt',     'Заміна ременя ГРМ',                         90000, 60,
     array['petrol','diesel','lpg','hybrid']::public.engine_type[], 90),
  ('gearbox_oil',     'Заміна оливи в КПП',                        60000, 60, null, 100),
  ('tire_rotation',   'Сезонна заміна шин',                        null,   6, null, 110),
  ('wheel_alignment', 'Розвал-сходження',                          20000, 12, null, 120),
  ('battery',         'Перевірка / заміна акумулятора 12 В',       null,  48, null, 130);
