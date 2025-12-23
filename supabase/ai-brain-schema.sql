-- ============================================
-- جداول نظام عقل الذكاء الاصطناعي المتقدم
-- Advanced AI Brain System Database Schema
-- ============================================

-- ============================================
-- 1. جدول تجارب التعلم (Learning Experiences)
-- ============================================
create table if not exists public.ai_experiences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  experience_id text unique not null,
  task_type text not null,
  website text not null,
  action text not null,
  selector text,
  success boolean not null,
  timestamp timestamp with time zone not null,
  context jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  execution_time integer, -- بالميلي ثانية
  retry_count integer default 0,
  confidence float default 0.5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_experiences enable row level security;

-- السياسات
create policy "Users can view own experiences"
  on public.ai_experiences for select
  using (auth.uid() = user_id);

create policy "Users can insert own experiences"
  on public.ai_experiences for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own experiences"
  on public.ai_experiences for delete
  using (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_experiences_user_id_idx on public.ai_experiences(user_id);
create index if not exists ai_experiences_website_idx on public.ai_experiences(website);
create index if not exists ai_experiences_task_type_idx on public.ai_experiences(task_type);
create index if not exists ai_experiences_success_idx on public.ai_experiences(success);
create index if not exists ai_experiences_timestamp_idx on public.ai_experiences(timestamp desc);

-- ============================================
-- 2. جدول قاعدة المعرفة (Knowledge Base)
-- ============================================
create table if not exists public.ai_knowledge (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  knowledge_id text unique not null,
  category text not null check (category in ('selector', 'workflow', 'error_pattern', 'best_practice', 'code_fixes', 'error_fixes')),
  domain text not null,
  content jsonb not null,
  tags text[] default array[]::text[],
  confidence float default 0.5 check (confidence >= 0 and confidence <= 1),
  usage_count integer default 0,
  success_rate float default 0 check (success_rate >= 0 and success_rate <= 1),
  last_used timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_knowledge enable row level security;

-- السياسات
create policy "Users can view own knowledge"
  on public.ai_knowledge for select
  using (auth.uid() = user_id);

create policy "Users can insert own knowledge"
  on public.ai_knowledge for insert
  with check (auth.uid() = user_id);

create policy "Users can update own knowledge"
  on public.ai_knowledge for update
  using (auth.uid() = user_id);

create policy "Users can delete own knowledge"
  on public.ai_knowledge for delete
  using (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_knowledge_user_id_idx on public.ai_knowledge(user_id);
create index if not exists ai_knowledge_category_idx on public.ai_knowledge(category);
create index if not exists ai_knowledge_domain_idx on public.ai_knowledge(domain);
create index if not exists ai_knowledge_tags_idx on public.ai_knowledge using gin(tags);
create index if not exists ai_knowledge_confidence_idx on public.ai_knowledge(confidence desc);
create index if not exists ai_knowledge_usage_idx on public.ai_knowledge(usage_count desc);

-- Trigger لتحديث updated_at
create trigger set_updated_at_ai_knowledge
  before update on public.ai_knowledge
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- 3. جدول الأنماط المكتشفة (Discovered Patterns)
-- ============================================
create table if not exists public.ai_patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  pattern_id text unique not null,
  website text not null,
  task_type text not null,
  pattern_type text not null check (pattern_type in ('selector', 'workflow', 'error', 'timing', 'behavior')),
  pattern_data jsonb not null,
  occurrence_count integer default 1,
  success_rate float default 0 check (success_rate >= 0 and success_rate <= 1),
  confidence float default 0.5 check (confidence >= 0 and confidence <= 1),
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_patterns enable row level security;

-- السياسات
create policy "Users can view own patterns"
  on public.ai_patterns for select
  using (auth.uid() = user_id);

create policy "Users can insert own patterns"
  on public.ai_patterns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own patterns"
  on public.ai_patterns for update
  using (auth.uid() = user_id);

create policy "Users can delete own patterns"
  on public.ai_patterns for delete
  using (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_patterns_user_id_idx on public.ai_patterns(user_id);
create index if not exists ai_patterns_website_idx on public.ai_patterns(website);
create index if not exists ai_patterns_task_type_idx on public.ai_patterns(task_type);
create index if not exists ai_patterns_pattern_type_idx on public.ai_patterns(pattern_type);
create index if not exists ai_patterns_success_rate_idx on public.ai_patterns(success_rate desc);

-- ============================================
-- 4. جدول التكيفات (Adaptations)
-- ============================================
create table if not exists public.ai_adaptations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  adaptation_id text unique not null,
  website text not null,
  change_type text not null check (change_type in ('layout', 'selector', 'workflow', 'authentication', 'content')),
  detected_at timestamp with time zone not null,
  old_pattern jsonb,
  new_pattern jsonb,
  severity text not null check (severity in ('minor', 'moderate', 'major', 'critical')),
  adaptation_applied boolean default false,
  adaptation_data jsonb default '{}'::jsonb,
  success boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_adaptations enable row level security;

-- السياسات
create policy "Users can view own adaptations"
  on public.ai_adaptations for select
  using (auth.uid() = user_id);

create policy "Users can insert own adaptations"
  on public.ai_adaptations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own adaptations"
  on public.ai_adaptations for update
  using (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_adaptations_user_id_idx on public.ai_adaptations(user_id);
create index if not exists ai_adaptations_website_idx on public.ai_adaptations(website);
create index if not exists ai_adaptations_change_type_idx on public.ai_adaptations(change_type);
create index if not exists ai_adaptations_severity_idx on public.ai_adaptations(severity);

-- ============================================
-- 5. جدول نماذج التعلم (Learning Models)
-- ============================================
create table if not exists public.ai_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  model_id text unique not null,
  website text not null,
  model_type text not null check (model_type in ('selector_prediction', 'strategy_selection', 'error_prediction', 'timing_optimization')),
  model_data jsonb not null,
  training_samples integer default 0,
  accuracy float default 0 check (accuracy >= 0 and accuracy <= 1),
  version integer default 1,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_models enable row level security;

-- السياسات
create policy "Users can view own models"
  on public.ai_models for select
  using (auth.uid() = user_id);

create policy "Users can insert own models"
  on public.ai_models for insert
  with check (auth.uid() = user_id);

create policy "Users can update own models"
  on public.ai_models for update
  using (auth.uid() = user_id);

create policy "Users can delete own models"
  on public.ai_models for delete
  using (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_models_user_id_idx on public.ai_models(user_id);
create index if not exists ai_models_website_idx on public.ai_models(website);
create index if not exists ai_models_model_type_idx on public.ai_models(model_type);
create index if not exists ai_models_is_active_idx on public.ai_models(is_active);

-- Trigger لتحديث updated_at
create trigger set_updated_at_ai_models
  before update on public.ai_models
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- 6. جدول إعدادات عقل AI (AI Brain Settings)
-- ============================================
create table if not exists public.ai_brain_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  
  -- Learning Settings
  learning_enabled boolean default true,
  auto_learn boolean default true,
  min_confidence_threshold float default 0.6 check (min_confidence_threshold >= 0 and min_confidence_threshold <= 1),
  max_experiences_per_website integer default 1000,
  experience_retention_days integer default 90,
  
  -- Knowledge Settings
  knowledge_sharing_enabled boolean default false,
  auto_knowledge_cleanup boolean default true,
  min_knowledge_confidence float default 0.5 check (min_knowledge_confidence >= 0 and min_knowledge_confidence <= 1),
  max_knowledge_entries integer default 5000,
  
  -- Adaptation Settings
  auto_adaptation_enabled boolean default true,
  adaptation_sensitivity text default 'medium' check (adaptation_sensitivity in ('low', 'medium', 'high', 'aggressive')),
  require_confirmation boolean default false,
  
  -- Code Intelligence Settings
  code_analysis_enabled boolean default true,
  auto_fix_enabled boolean default true,
  auto_fix_confidence_threshold float default 0.7 check (auto_fix_confidence_threshold >= 0 and auto_fix_confidence_threshold <= 1),
  code_quality_threshold integer default 70 check (code_quality_threshold >= 0 and code_quality_threshold <= 100),
  
  -- Performance Settings
  max_retry_attempts integer default 3,
  learning_batch_size integer default 100,
  cache_enabled boolean default true,
  cache_ttl_minutes integer default 60,
  
  -- Advanced Settings
  experimental_features_enabled boolean default false,
  debug_mode boolean default false,
  telemetry_enabled boolean default true,
  
  -- Custom Settings
  custom_settings jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_brain_settings enable row level security;

-- السياسات
create policy "Users can view own ai brain settings"
  on public.ai_brain_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai brain settings"
  on public.ai_brain_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai brain settings"
  on public.ai_brain_settings for update
  using (auth.uid() = user_id);

-- Index للأداء
create index if not exists ai_brain_settings_user_id_idx on public.ai_brain_settings(user_id);

-- Trigger لتحديث updated_at
create trigger set_updated_at_ai_brain_settings
  before update on public.ai_brain_settings
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- 7. جدول إحصائيات الأداء (Performance Stats)
-- ============================================
create table if not exists public.ai_performance_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  website text,
  stat_type text not null check (stat_type in ('daily', 'weekly', 'monthly', 'all_time')),
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  
  -- Metrics
  total_tasks integer default 0,
  successful_tasks integer default 0,
  failed_tasks integer default 0,
  success_rate float default 0,
  
  average_execution_time float default 0,
  total_experiences integer default 0,
  total_patterns integer default 0,
  total_adaptations integer default 0,
  
  code_fixes_applied integer default 0,
  code_fix_success_rate float default 0,
  
  -- AI Metrics
  learning_progress float default 0,
  knowledge_growth float default 0,
  model_accuracy float default 0,
  confidence_level float default 0,
  
  stats_data jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل RLS
alter table public.ai_performance_stats enable row level security;

-- السياسات
create policy "Users can view own stats"
  on public.ai_performance_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on public.ai_performance_stats for insert
  with check (auth.uid() = user_id);

-- Indexes للأداء
create index if not exists ai_performance_stats_user_id_idx on public.ai_performance_stats(user_id);
create index if not exists ai_performance_stats_website_idx on public.ai_performance_stats(website);
create index if not exists ai_performance_stats_stat_type_idx on public.ai_performance_stats(stat_type);
create index if not exists ai_performance_stats_period_idx on public.ai_performance_stats(period_start desc, period_end desc);

-- ============================================
-- 8. دالة لإنشاء إعدادات AI Brain تلقائياً
-- ============================================
create or replace function public.create_default_ai_brain_settings()
returns trigger as $$
begin
  insert into public.ai_brain_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger لإنشاء إعدادات AI Brain تلقائياً عند إنشاء مستخدم
create trigger on_user_created_ai_settings
  after insert on auth.users
  for each row execute function public.create_default_ai_brain_settings();

-- ============================================
-- 9. دوال مساعدة للإحصائيات
-- ============================================

-- دالة لحساب معدل النجاح
create or replace function public.calculate_success_rate(
  p_user_id uuid,
  p_website text default null,
  p_days integer default 30
)
returns float as $$
declare
  v_success_rate float;
begin
  select 
    case 
      when count(*) = 0 then 0
      else count(*) filter (where success = true)::float / count(*)::float
    end into v_success_rate
  from public.ai_experiences
  where user_id = p_user_id
    and (p_website is null or website = p_website)
    and timestamp >= now() - interval '1 day' * p_days;
  
  return coalesce(v_success_rate, 0);
end;
$$ language plpgsql security definer;

-- دالة للحصول على أفضل المواقع أداءً
create or replace function public.get_top_performing_websites(
  p_user_id uuid,
  p_limit integer default 10
)
returns table (
  website text,
  total_tasks bigint,
  success_rate float,
  avg_execution_time float
) as $$
begin
  return query
  select 
    e.website,
    count(*)::bigint as total_tasks,
    (count(*) filter (where e.success = true)::float / count(*)::float) as success_rate,
    avg(e.execution_time)::float as avg_execution_time
  from public.ai_experiences e
  where e.user_id = p_user_id
  group by e.website
  having count(*) >= 5
  order by success_rate desc, total_tasks desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- دالة لتنظيف البيانات القديمة
create or replace function public.cleanup_old_ai_data(
  p_user_id uuid,
  p_retention_days integer default 90
)
returns integer as $$
declare
  v_deleted_count integer;
begin
  -- حذف التجارب القديمة
  delete from public.ai_experiences
  where user_id = p_user_id
    and created_at < now() - interval '1 day' * p_retention_days;
  
  get diagnostics v_deleted_count = row_count;
  
  -- حذف الأنماط غير المستخدمة
  delete from public.ai_patterns
  where user_id = p_user_id
    and last_seen < now() - interval '1 day' * p_retention_days
    and occurrence_count < 3;
  
  -- حذف المعرفة ذات الثقة المنخفضة
  delete from public.ai_knowledge
  where user_id = p_user_id
    and confidence < 0.3
    and usage_count < 2
    and created_at < now() - interval '1 day' * p_retention_days;
  
  return v_deleted_count;
end;
$$ language plpgsql security definer;

-- ============================================
-- منح الصلاحيات
-- ============================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ============================================
-- تعليقات توضيحية
-- ============================================
comment on table public.ai_experiences is 'جدول تخزين تجارب التعلم للروبوت';
comment on table public.ai_knowledge is 'قاعدة المعرفة المكتسبة من التجارب';
comment on table public.ai_patterns is 'الأنماط المكتشفة من سلوك المواقع';
comment on table public.ai_adaptations is 'سجل التكيفات مع تغييرات المواقع';
comment on table public.ai_models is 'نماذج التعلم الآلي المدربة';
comment on table public.ai_brain_settings is 'إعدادات نظام عقل الذكاء الاصطناعي';
comment on table public.ai_performance_stats is 'إحصائيات الأداء والتقدم';
