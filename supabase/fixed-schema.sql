-- =====================================================
-- مخطط قاعدة البيانات المُصلح - Web Automation Bot
-- يتضمن: المستخدمين، المهام، القوالب، AI Brain، التعلم، المعرفة
-- =====================================================

-- تفعيل الامتدادات المطلوبة
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- 1. جدول الملفات الشخصية (Profiles)
-- =====================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'developer')),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================================================
-- 2. جدول المهام (Tasks)
-- =====================================================

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text not null,
  type text not null check (type in ('scraping', 'login', 'registration', 'testing', 'screenshot', 'form-fill', 'monitoring', 'custom')),
  status text default 'idle' check (status in ('idle', 'running', 'completed', 'failed', 'paused')),
  script text not null,
  target_url text not null,
  schedule text,
  priority integer default 5 check (priority between 1 and 10),
  retry_count integer default 0,
  max_retries integer default 3,
  timeout_seconds integer default 60,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  success_count integer default 0,
  failure_count integer default 0,
  metadata jsonb default '{}'::jsonb,
  tags text[] default array[]::text[]
);

alter table public.tasks enable row level security;

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

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_created_at_idx on public.tasks(created_at desc);
create index if not exists tasks_next_run_idx on public.tasks(next_run);
create index if not exists tasks_tags_idx on public.tasks using gin(tags);

-- =====================================================
-- 3. جدول سجلات التنفيذ (Execution Logs)
-- =====================================================

create table if not exists public.execution_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text not null check (status in ('success', 'failed', 'running', 'cancelled')),
  started_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  duration_ms integer,
  error_message text,
  output jsonb default '{}'::jsonb,
  screenshots jsonb default '[]'::jsonb,
  videos jsonb default '[]'::jsonb,
  console_logs text[],
  metadata jsonb default '{}'::jsonb
);

alter table public.execution_logs enable row level security;

create policy "Users can view own execution logs"
  on public.execution_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own execution logs"
  on public.execution_logs for insert
  with check (auth.uid() = user_id);

create index if not exists execution_logs_task_id_idx on public.execution_logs(task_id);
create index if not exists execution_logs_user_id_idx on public.execution_logs(user_id);
create index if not exists execution_logs_started_at_idx on public.execution_logs(started_at desc);

-- =====================================================
-- 4. جدول قوالب المهام (Task Templates)
-- =====================================================

create table if not exists public.task_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text not null,
  category text not null check (category in ('social-media', 'ecommerce', 'productivity', 'testing', 'monitoring', 'data-extraction', 'automation', 'other')),
  type text not null,
  icon text,
  is_public boolean default false,
  is_verified boolean default false,
  template_data jsonb not null,
  usage_count integer default 0,
  rating_average numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  tags text[] default array[]::text[]
);

alter table public.task_templates enable row level security;

create policy "Users can view public templates"
  on public.task_templates for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own templates"
  on public.task_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own templates"
  on public.task_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete own templates"
  on public.task_templates for delete
  using (auth.uid() = user_id);

create index if not exists task_templates_category_idx on public.task_templates(category);
create index if not exists task_templates_is_public_idx on public.task_templates(is_public);
create index if not exists task_templates_tags_idx on public.task_templates using gin(tags);

-- =====================================================
-- 5. جدول إعدادات عقل AI (AI Brain Settings)
-- =====================================================

create table if not exists public.ai_brain_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  learning_enabled boolean default true,
  auto_learn boolean default false,
  min_confidence_threshold numeric(3,2) default 0.70,
  max_experiences_per_website integer default 1000,
  experience_retention_days integer default 90,
  knowledge_sharing_enabled boolean default false,
  auto_knowledge_cleanup boolean default true,
  min_knowledge_confidence numeric(3,2) default 0.60,
  max_knowledge_entries integer default 10000,
  auto_adaptation_enabled boolean default true,
  require_confirmation boolean default true,
  adaptation_sensitivity text default 'medium' check (adaptation_sensitivity in ('low', 'medium', 'high', 'aggressive')),
  code_analysis_enabled boolean default true,
  auto_fix_enabled boolean default false,
  auto_fix_confidence_threshold numeric(3,2) default 0.85,
  code_quality_threshold integer default 70,
  max_retry_attempts integer default 3,
  learning_batch_size integer default 100,
  cache_enabled boolean default true,
  cache_ttl_minutes integer default 60,
  experimental_features_enabled boolean default false,
  debug_mode boolean default false,
  telemetry_enabled boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.ai_brain_settings enable row level security;

create policy "Users can view own ai brain settings"
  on public.ai_brain_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai brain settings"
  on public.ai_brain_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai brain settings"
  on public.ai_brain_settings for update
  using (auth.uid() = user_id);

create index if not exists ai_brain_settings_user_id_idx on public.ai_brain_settings(user_id);

-- =====================================================
-- 6. جدول خبرات التعلم (Learning Experiences)
-- =====================================================

create table if not exists public.learning_experiences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  website_url text not null,
  action_type text not null,
  selector text not null,
  success boolean not null,
  confidence numeric(3,2) not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null
);

alter table public.learning_experiences enable row level security;

create policy "Users can view own learning experiences"
  on public.learning_experiences for select
  using (auth.uid() = user_id);

create policy "Users can insert own learning experiences"
  on public.learning_experiences for insert
  with check (auth.uid() = user_id);

create index if not exists learning_experiences_user_id_idx on public.learning_experiences(user_id);
create index if not exists learning_experiences_website_url_idx on public.learning_experiences(website_url);
create index if not exists learning_experiences_created_at_idx on public.learning_experiences(created_at desc);

-- =====================================================
-- 7. جدول قاعدة المعرفة (Knowledge Base)
-- =====================================================

create table if not exists public.knowledge_base (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  key text not null,
  value jsonb not null,
  confidence numeric(3,2) not null,
  source text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, category, key)
);

alter table public.knowledge_base enable row level security;

create policy "Users can view own knowledge base"
  on public.knowledge_base for select
  using (auth.uid() = user_id);

create policy "Users can insert own knowledge base"
  on public.knowledge_base for insert
  with check (auth.uid() = user_id);

create policy "Users can update own knowledge base"
  on public.knowledge_base for update
  using (auth.uid() = user_id);

create policy "Users can delete own knowledge base"
  on public.knowledge_base for delete
  using (auth.uid() = user_id);

create index if not exists knowledge_base_user_id_idx on public.knowledge_base(user_id);
create index if not exists knowledge_base_category_idx on public.knowledge_base(category);

-- =====================================================
-- 8. جدول الأنماط المكتشفة (Detected Patterns)
-- =====================================================

create table if not exists public.detected_patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pattern_type text not null,
  pattern_data jsonb not null,
  occurrences integer default 1,
  confidence numeric(3,2) not null,
  last_seen timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

alter table public.detected_patterns enable row level security;

create policy "Users can view own detected patterns"
  on public.detected_patterns for select
  using (auth.uid() = user_id);

create policy "Users can insert own detected patterns"
  on public.detected_patterns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own detected patterns"
  on public.detected_patterns for update
  using (auth.uid() = user_id);

create index if not exists detected_patterns_user_id_idx on public.detected_patterns(user_id);
create index if not exists detected_patterns_pattern_type_idx on public.detected_patterns(pattern_type);

-- =====================================================
-- 9. جدول البيانات المخصصة (Custom Data Storage)
-- =====================================================

create table if not exists public.custom_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  data_key text not null,
  data_value jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, data_key)
);

alter table public.custom_data enable row level security;

create policy "Users can view own custom data"
  on public.custom_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own custom data"
  on public.custom_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own custom data"
  on public.custom_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own custom data"
  on public.custom_data for delete
  using (auth.uid() = user_id);

create index if not exists custom_data_user_id_idx on public.custom_data(user_id);
create index if not exists custom_data_data_key_idx on public.custom_data(data_key);

-- =====================================================
-- 10. جدول إحصائيات الأداء (Performance Stats)
-- =====================================================

create table if not exists public.performance_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  metric_name text not null,
  metric_value numeric not null,
  timestamp timestamp with time zone default now() not null
);

alter table public.performance_stats enable row level security;

create policy "Users can view own performance stats"
  on public.performance_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own performance stats"
  on public.performance_stats for insert
  with check (auth.uid() = user_id);

create index if not exists performance_stats_user_id_idx on public.performance_stats(user_id);
create index if not exists performance_stats_timestamp_idx on public.performance_stats(timestamp desc);

-- =====================================================
-- الدوال المُساعدة (Helper Functions)
-- =====================================================

-- دالة لتحديث updated_at تلقائياً
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- تطبيق trigger على الجداول المطلوبة
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_updated_at_column();

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row
  execute function update_updated_at_column();

create trigger update_task_templates_updated_at
  before update on public.task_templates
  for each row
  execute function update_updated_at_column();

create trigger update_ai_brain_settings_updated_at
  before update on public.ai_brain_settings
  for each row
  execute function update_updated_at_column();

create trigger update_knowledge_base_updated_at
  before update on public.knowledge_base
  for each row
  execute function update_updated_at_column();

create trigger update_custom_data_updated_at
  before update on public.custom_data
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- Views (عروض مفيدة)
-- =====================================================

-- عرض لإحصائيات المهام لكل مستخدم
create or replace view public.user_task_stats as
select
  user_id,
  count(*) as total_tasks,
  count(*) filter (where status = 'completed') as completed_tasks,
  count(*) filter (where status = 'failed') as failed_tasks,
  count(*) filter (where status = 'running') as running_tasks,
  avg(success_count::numeric / nullif(success_count + failure_count, 0)) as success_rate
from public.tasks
group by user_id;

-- عرض لأحدث سجلات التنفيذ
create or replace view public.recent_executions as
select
  el.*,
  t.name as task_name,
  t.type as task_type
from public.execution_logs el
join public.tasks t on t.id = el.task_id
order by el.started_at desc
limit 100;
