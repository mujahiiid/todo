create extension if not exists pgcrypto;

create type public.block_type as enum ('heading','text','divider','spacer','task','daily_routine','weekly_task','checklist','reminder','daily_tracker','section');
create type public.completion_status as enum ('completed','missed','pending');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'en' check (locale in ('en','ar')),
  week_starts_on smallint not null default 6 check (week_starts_on between 0 and 6),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  notifications_enabled boolean not null default false, weekly_reports_enabled boolean not null default true,
  automatic_reports boolean not null default true, default_page_id uuid, updated_at timestamptz not null default now()
);
create table public.pages (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), icon text not null default 'NotebookTabs', accent_color text,
  description text, position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.user_settings add constraint user_settings_default_page_fk foreign key (default_page_id) references public.pages(id) on delete set null;
create table public.blocks (
  id uuid primary key default gen_random_uuid(), page_id uuid not null references public.pages(id) on delete cascade,
  type public.block_type not null, position integer not null default 0, configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(page_id, position) deferrable initially deferred
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), block_id uuid not null unique references public.blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null, description text,
  frequency jsonb not null default '{"kind":"daily"}'::jsonb, timezone text, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.task_slots (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete cascade,
  label text, local_time time not null, reminder_enabled boolean not null default false, position integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.task_completion_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade, slot_id uuid not null references public.task_slots(id) on delete cascade,
  occurrence_date date not null, status public.completion_status not null, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(task_id, occurrence_date, slot_id)
);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null, p256dh text not null, auth text not null, user_agent text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, endpoint)
);
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null, slot_id text not null,
  occurrence_date date not null, scheduled_for timestamptz not null, status text not null default 'claimed', error text,
  created_at timestamptz not null default now(), unique(task_id, slot_id, occurrence_date)
);
create table public.weekly_archives (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, week_end date not null, snapshot jsonb not null default '{}'::jsonb,
  completed integer not null default 0, missed integer not null default 0, pending integer not null default 0,
  completion_rate numeric(5,2) not null default 0, report_available boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, week_start)
);
create table public.user_app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index pages_user_position_idx on public.pages(user_id, position);
create index blocks_page_position_idx on public.blocks(page_id, position);
create index tasks_user_enabled_idx on public.tasks(user_id, enabled);
create index logs_user_date_idx on public.task_completion_logs(user_id, occurrence_date);
create index archives_user_week_idx on public.weekly_archives(user_id, week_start desc);
create index notification_logs_schedule_idx on public.notification_logs(scheduled_for, status);

alter table public.profiles enable row level security; alter table public.user_settings enable row level security;
alter table public.pages enable row level security; alter table public.blocks enable row level security; alter table public.tasks enable row level security;
alter table public.task_slots enable row level security; alter table public.task_completion_logs enable row level security;
alter table public.push_subscriptions enable row level security; alter table public.notification_logs enable row level security; alter table public.weekly_archives enable row level security;
alter table public.user_app_states enable row level security;

create policy "profiles own rows" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "settings own rows" on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pages own rows" on public.pages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "blocks through owned pages" on public.blocks for all using (exists(select 1 from public.pages p where p.id = page_id and p.user_id = auth.uid())) with check (exists(select 1 from public.pages p where p.id = page_id and p.user_id = auth.uid()));
create policy "tasks own rows" on public.tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "slots through owned tasks" on public.task_slots for all using (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())) with check (exists(select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "completion logs own rows" on public.task_completion_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push subscriptions own rows" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notification logs own rows" on public.notification_logs for select using (user_id = auth.uid());
create policy "weekly archives own rows" on public.weekly_archives for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "app state own row" on public.user_app_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, timezone) values(new.id, coalesce(new.raw_user_meta_data->>'timezone','UTC')); insert into public.user_settings(user_id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.claim_due_notifications(p_due_minute text)
returns table(id uuid, user_id uuid, task_id text, slot_id text) language sql security definer set search_path = public as $$
  select nl.id, nl.user_id, nl.task_id, nl.slot_id from public.notification_logs nl where nl.status = 'claimed' and nl.scheduled_for >= p_due_minute::timestamptz and nl.scheduled_for < p_due_minute::timestamptz + interval '1 minute' for update skip locked;
$$;

create or replace function public.archive_finished_weeks() returns integer language plpgsql security definer set search_path = public as $$
declare inserted_count integer;
begin
  insert into public.weekly_archives(user_id, week_start, week_end, snapshot, completed, missed, pending, completion_rate)
  select u.id, (current_date - ((extract(dow from current_date)::int - s.week_starts_on + 7) % 7) - 7), (current_date - ((extract(dow from current_date)::int - s.week_starts_on + 7) % 7) - 1), '{}'::jsonb,
    count(*) filter(where l.status='completed'), count(*) filter(where l.status='missed'), count(*) filter(where l.status is null),
    case when count(l.id)=0 then 0 else round(100.0 * count(*) filter(where l.status='completed') / count(l.id),2) end
  from auth.users u join public.user_settings s on s.user_id=u.id left join public.task_completion_logs l on l.user_id=u.id and l.occurrence_date between (current_date - 13) and (current_date - 1)
  group by u.id, s.week_starts_on on conflict(user_id, week_start) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end $$;
