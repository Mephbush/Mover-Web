-- =====================================================
-- مخطط قاعدة البيانات الكامل - Web Automation Bot
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
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
-- 3. جدول قوالب المهام (Task Templates)
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
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  estimated_time_minutes integer,
  script_template text not null,
  default_config jsonb default '{}'::jsonb,
  required_fields jsonb default '[]'::jsonb,
  tags text[] default array[]::text[],
  usage_count integer default 0,
  rating numeric(3,2) default 0.00,
  rating_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.task_templates enable row level security;

create policy "Anyone can view public templates"
  on public.task_templates for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can create templates"
  on public.task_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own templates"
  on public.task_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete own templates"
  on public.task_templates for delete
  using (auth.uid() = user_id);

create index if not exists templates_category_idx on public.task_templates(category);
create index if not exists templates_public_idx on public.task_templates(is_public) where is_public = true;
create index if not exists templates_tags_idx on public.task_templates using gin(tags);
create index if not exists templates_rating_idx on public.task_templates(rating desc);

-- =====================================================
-- 4. جدول سجلات التنفيذ (Execution Logs)
-- =====================================================

create table if not exists public.execution_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete cascade not null,
  task_name text not null,
  status text not null check (status in ('success', 'failed', 'running', 'cancelled', 'timeout')),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration integer,
  logs jsonb default '[]'::jsonb,
  console_logs text[],
  screenshot_urls text[],
  error_message text,
  error_stack text,
  data jsonb default '{}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.execution_logs enable row level security;

create policy "Users can view own logs"
  on public.execution_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.execution_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.execution_logs for delete
  using (auth.uid() = user_id);

create index if not exists logs_user_id_idx on public.execution_logs(user_id);
create index if not exists logs_task_id_idx on public.execution_logs(task_id);
create index if not exists logs_created_at_idx on public.execution_logs(created_at desc);
create index if not exists logs_status_idx on public.execution_logs(status);

-- =====================================================
-- 5. جدول الإعدادات (Settings)
-- =====================================================

create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  github_token text,
  github_repo text,
  github_owner text,
  github_branch text default 'main',
  stealth_settings jsonb default '{
    "level": "advanced",
    "randomUserAgent": true,
    "randomViewport": true,
    "hideWebdriver": true,
    "randomTimezone": true,
    "humanClicks": true,
    "humanTyping": true,
    "randomDelays": true,
    "mouseMovement": true,
    "scrollBehavior": true,
    "blockWebRTC": true,
    "maskFingerprint": true
  }'::jsonb,
  execution_settings jsonb default '{
    "mode": "github",
    "maxConcurrent": 3,
    "timeout": 60000,
    "retries": 3
  }'::jsonb,
  notification_settings jsonb default '{
    "email": true,
    "push": false,
    "onSuccess": false,
    "onFailure": true
  }'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings enable row level security;

create policy "Users can view own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

create index if not exists settings_user_id_idx on public.settings(user_id);

-- =====================================================
-- 6. جدول عقل الروبوت AI Brain (Knowledge Base)
-- =====================================================

create table if not exists public.ai_knowledge_base (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('bot-detection', 'anti-detection', 'selectors', 'errors', 'patterns', 'best-practices')),
  subcategory text,
  title text not null,
  content text not null,
  code_example text,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard', 'advanced')),
  tags text[] default array[]::text[],
  priority integer default 5 check (priority between 1 and 10),
  effectiveness_score numeric(3,2) default 0.00,
  usage_count integer default 0,
  success_rate numeric(5,2) default 0.00,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_knowledge_base enable row level security;

create policy "Anyone can read knowledge base"
  on public.ai_knowledge_base for select
  using (true);

create policy "Admins can manage knowledge base"
  on public.ai_knowledge_base for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists knowledge_category_idx on public.ai_knowledge_base(category);
create index if not exists knowledge_tags_idx on public.ai_knowledge_base using gin(tags);
create index if not exists knowledge_priority_idx on public.ai_knowledge_base(priority desc);
create index if not exists knowledge_effectiveness_idx on public.ai_knowledge_base(effectiveness_score desc);

-- =====================================================
-- 7. جدول تعلم الروبوت AI Learning (Machine Learning)
-- =====================================================

create table if not exists public.ai_learning_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  task_id uuid references public.tasks on delete cascade,
  log_id uuid references public.execution_logs on delete cascade,
  learning_type text not null check (learning_type in ('success-pattern', 'failure-pattern', 'optimization', 'detection-bypass', 'selector-evolution')),
  context jsonb not null,
  action_taken text not null,
  result text not null check (result in ('success', 'failure', 'partial')),
  confidence_score numeric(3,2) default 0.50 check (confidence_score between 0 and 1),
  applied_count integer default 0,
  success_count integer default 0,
  failure_count integer default 0,
  impact_score numeric(5,2) default 0.00,
  is_validated boolean default false,
  validated_by uuid references auth.users,
  validated_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_learning_data enable row level security;

create policy "Users can view own learning data"
  on public.ai_learning_data for select
  using (auth.uid() = user_id or user_id is null);

create policy "System can insert learning data"
  on public.ai_learning_data for insert
  with check (true);

create index if not exists learning_task_id_idx on public.ai_learning_data(task_id);
create index if not exists learning_type_idx on public.ai_learning_data(learning_type);
create index if not exists learning_confidence_idx on public.ai_learning_data(confidence_score desc);
create index if not exists learning_impact_idx on public.ai_learning_data(impact_score desc);
create index if not exists learning_validated_idx on public.ai_learning_data(is_validated);

-- =====================================================
-- 8. جدول قرارات الروبوت AI Decisions
-- =====================================================

create table if not exists public.ai_decisions (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks on delete cascade,
  log_id uuid references public.execution_logs on delete cascade,
  decision_type text not null check (decision_type in ('strategy-selection', 'retry-logic', 'error-recovery', 'optimization', 'adaptation')),
  situation jsonb not null,
  available_options jsonb not null,
  selected_option text not null,
  reasoning text not null,
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  outcome text check (outcome in ('success', 'failure', 'pending', 'unknown')),
  actual_result jsonb,
  feedback_score numeric(3,2),
  learning_applied boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_decisions enable row level security;

create policy "Anyone can read decisions"
  on public.ai_decisions for select
  using (true);

create policy "System can insert decisions"
  on public.ai_decisions for insert
  with check (true);

create index if not exists decisions_task_id_idx on public.ai_decisions(task_id);
create index if not exists decisions_type_idx on public.ai_decisions(decision_type);
create index if not exists decisions_outcome_idx on public.ai_decisions(outcome);
create index if not exists decisions_created_at_idx on public.ai_decisions(created_at desc);

-- =====================================================
-- 9. جدول إحصائيات الأداء Performance Stats
-- =====================================================

create table if not exists public.performance_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  task_id uuid references public.tasks on delete cascade,
  date date not null default current_date,
  total_runs integer default 0,
  successful_runs integer default 0,
  failed_runs integer default 0,
  avg_duration_ms numeric(10,2),
  total_duration_ms bigint default 0,
  error_count integer default 0,
  bypass_success_rate numeric(5,2),
  detection_count integer default 0,
  metrics jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, task_id, date)
);

alter table public.performance_stats enable row level security;

create policy "Users can view own stats"
  on public.performance_stats for select
  using (auth.uid() = user_id);

create index if not exists perf_stats_user_id_idx on public.performance_stats(user_id);
create index if not exists perf_stats_task_id_idx on public.performance_stats(task_id);
create index if not exists perf_stats_date_idx on public.performance_stats(date desc);

-- =====================================================
-- 10. الدوال المساعدة Functions
-- =====================================================

-- دالة لتحديث updated_at تلقائياً
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- تطبيق Triggers لتحديث updated_at
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_tasks
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_templates
  before update on public.task_templates
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_settings
  before update on public.settings
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_knowledge
  before update on public.ai_knowledge_base
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_learning
  before update on public.ai_learning_data
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_perf_stats
  before update on public.performance_stats
  for each row execute function public.handle_updated_at();

-- دالة لإنشاء ملف تعريف وإعدادات تلقائياً عند التسجيل
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

-- دالة لتحديث إحصائيات الأداء
create or replace function public.update_performance_stats()
returns trigger as $$
declare
  stat_date date := current_date;
  task_duration integer := coalesce(new.duration, 0);
begin
  if new.status in ('success', 'failed') then
    insert into public.performance_stats (
      user_id, task_id, date, total_runs,
      successful_runs, failed_runs,
      total_duration_ms, avg_duration_ms
    ) values (
      new.user_id, new.task_id, stat_date, 1,
      case when new.status = 'success' then 1 else 0 end,
      case when new.status = 'failed' then 1 else 0 end,
      task_duration,
      task_duration
    )
    on conflict (user_id, task_id, date)
    do update set
      total_runs = performance_stats.total_runs + 1,
      successful_runs = performance_stats.successful_runs + 
        case when new.status = 'success' then 1 else 0 end,
      failed_runs = performance_stats.failed_runs + 
        case when new.status = 'failed' then 1 else 0 end,
      total_duration_ms = performance_stats.total_duration_ms + task_duration,
      avg_duration_ms = (performance_stats.total_duration_ms + task_duration)::numeric / 
        (performance_stats.total_runs + 1),
      updated_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger لتحديث الإحصائيات تلقائياً
create trigger update_stats_on_log_completion
  after insert or update on public.execution_logs
  for each row
  when (new.status in ('success', 'failed'))
  execute function public.update_performance_stats();

-- =====================================================
-- 11. منح الصلاحيات
-- =====================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- =====================================================
-- 12. بيانات أولية Initial Data (معرفة AI Brain)
-- =====================================================

insert into public.ai_knowledge_base (category, subcategory, title, content, priority, effectiveness_score)
values
  ('bot-detection', 'webdriver', 'إخفاء Webdriver', 'استخدام playwright-extra و puppeteer-extra-plugin-stealth لإخفاء navigator.webdriver', 10, 0.95),
  ('bot-detection', 'fingerprint', 'تزييف Fingerprint', 'تغيير Canvas fingerprint وWebGL وغيرها من المعرفات', 9, 0.90),
  ('anti-detection', 'timing', 'التوقيت الطبيعي', 'إضافة تأخيرات عشوائية بين الإجراءات لمحاكاة السلوك البشري', 8, 0.85),
  ('anti-detection', 'mouse', 'حركة الفأرة البشرية', 'استخدام مسارات عشوائية وطبيعية لحركة الفأرة', 7, 0.80),
  ('selectors', 'dynamic', 'محددات ديناميكية', 'استخدام XPath وCSS selectors الذكية للعناصر المتغيرة', 8, 0.88);
