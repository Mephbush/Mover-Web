-- إنشاء جداول قاعدة البيانات للروبوت الذكي

-- تفعيل RLS (Row Level Security)
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- جدول الملفات الشخصية
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS على profiles
alter table public.profiles enable row level security;

-- سياسات الوصول لـ profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- جدول المهام
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text not null,
  type text not null check (type in ('scraping', 'login', 'registration', 'testing', 'screenshot', 'custom')),
  status text default 'idle' check (status in ('idle', 'running', 'completed', 'failed')),
  script text not null,
  target_url text not null,
  schedule text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_run timestamp with time zone,
  metadata jsonb default '{}'::jsonb
);

-- تفعيل RLS على tasks
alter table public.tasks enable row level security;

-- سياسات الوصول لـ tasks
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- إنشاء indexes للأداء
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_created_at_idx on public.tasks(created_at desc);

-- جدول سجلات التنفيذ
create table if not exists public.execution_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete cascade not null,
  task_name text not null,
  status text not null check (status in ('success', 'failed', 'running')),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration integer, -- بالميلي ثانية
  logs jsonb default '[]'::jsonb,
  screenshot text,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS على execution_logs
alter table public.execution_logs enable row level security;

-- سياسات الوصول لـ execution_logs
create policy "Users can view own logs"
  on public.execution_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.execution_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.execution_logs for delete
  using (auth.uid() = user_id);

-- إنشاء indexes للأداء
create index if not exists execution_logs_user_id_idx on public.execution_logs(user_id);
create index if not exists execution_logs_task_id_idx on public.execution_logs(task_id);
create index if not exists execution_logs_created_at_idx on public.execution_logs(created_at desc);
create index if not exists execution_logs_status_idx on public.execution_logs(status);

-- جدول الإعدادات
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  github_token text,
  github_repo text,
  github_branch text default 'main',
  stealth_settings jsonb default '{
    "enabled": true,
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "viewport": {"width": 1920, "height": 1080},
    "timezone": "America/New_York",
    "locale": "en-US",
    "webgl": true,
    "canvas": true
  }'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS على settings
alter table public.settings enable row level security;

-- سياسات الوصول لـ settings
create policy "Users can view own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

-- إنشاء index للأداء
create index if not exists settings_user_id_idx on public.settings(user_id);

-- دالة لتحديث updated_at تلقائياً
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers لتحديث updated_at
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_tasks
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_settings
  before update on public.settings
  for each row
  execute function public.handle_updated_at();

-- دالة لإنشاء ملف تعريف تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  insert into public.settings (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger لإنشاء ملف تعريف تلقائياً
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- منح الصلاحيات
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;
