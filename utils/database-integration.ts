/**
 * نظام التكامل الكامل مع قاعدة البيانات Supabase
 * يدير: المستخدمين، المهام، القوالب، عقل الروبوت، التعلم
 */

import { supabase } from '../lib/supabase';
import type { Task, ExecutionLog } from '../App';

// ========== التحقق من حالة Supabase ==========
export const checkSupabaseStatus = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    console.log('⚠️ Supabase غير متصل - استخدام localStorage');
    return { connected: false, error };
  }
};

// ========== إدارة المهام Tasks ==========

export const syncTasksWithDatabase = async (userId: string, localTasks: Task[]) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      console.log('📦 حفظ محلي: localStorage فقط');
      return { success: true, source: 'local' };
    }

    // جلب المهام من قاعدة البيانات
    const { data: remoteTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // دمج المهام المحلية مع البيانات البعيدة
    const mergedTasks = mergeTasks(localTasks, remoteTasks || []);

    // تحديث قاعدة البيانات
    for (const task of mergedTasks) {
      await upsertTask(userId, task);
    }

    return { success: true, source: 'database', tasks: mergedTasks };
  } catch (error: any) {
    console.error('خطأ في مزامنة المهام:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

export const upsertTask = async (userId: string, task: Task) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .upsert({
        id: task.id,
        user_id: userId,
        name: task.name,
        description: task.description,
        type: task.type,
        status: task.status,
        script: task.script,
        target_url: task.targetUrl,
        schedule: task.schedule,
        created_at: task.createdAt.toISOString(),
        last_run: task.lastRun?.toISOString(),
        metadata: task.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في حفظ المهمة:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

export const deleteTaskFromDatabase = async (userId: string, taskId: string) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في حذف المهمة:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

// ========== إدارة السجلات Logs ==========

export const saveExecutionLog = async (userId: string, log: ExecutionLog) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('execution_logs')
      .insert({
        user_id: userId,
        task_id: log.taskId,
        task_name: log.taskName,
        status: log.status,
        start_time: log.startTime.toISOString(),
        end_time: log.endTime?.toISOString(),
        duration: log.duration,
        logs: log.logs,
        screenshot: log.screenshot,
        data: log.data || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في حفظ السجل:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

export const getExecutionLogs = async (userId: string, limit: number = 100) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      // إرجاع السجلات المحلية
      const localLogs = JSON.parse(localStorage.getItem('automation-logs') || '[]');
      return { success: true, data: localLogs, source: 'local' };
    }

    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data: data || [], source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب السجلات:', error.message);
    const localLogs = JSON.parse(localStorage.getItem('automation-logs') || '[]');
    return { success: false, data: localLogs, error: error.message, source: 'local' };
  }
};

// ========== إدارة القوالب Templates ==========

export const getPublicTemplates = async () => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, data: [], source: 'local' };
    }

    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('is_public', true)
      .order('rating', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [], source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب القوالب:', error.message);
    return { success: false, data: [], error: error.message, source: 'local' };
  }
};

export const saveTemplate = async (userId: string, template: any) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description,
        category: template.category,
        type: template.type,
        icon: template.icon,
        is_public: template.isPublic || false,
        difficulty: template.difficulty || 'medium',
        script_template: template.scriptTemplate,
        default_config: template.defaultConfig || {},
        required_fields: template.requiredFields || [],
        tags: template.tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في حفظ القالب:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

// ========== عقل الروبوت AI Brain ==========

export const getAIKnowledge = async (category?: string) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, data: [], source: 'local' };
    }

    let query = supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [], source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب معرفة AI:', error.message);
    return { success: false, data: [], error: error.message, source: 'local' };
  }
};

export const recordAILearning = async (learningData: {
  userId?: string;
  taskId?: string;
  logId?: string;
  learningType: string;
  context: any;
  actionTaken: string;
  result: string;
  confidenceScore: number;
}) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('ai_learning_data')
      .insert({
        user_id: learningData.userId,
        task_id: learningData.taskId,
        log_id: learningData.logId,
        learning_type: learningData.learningType,
        context: learningData.context,
        action_taken: learningData.actionTaken,
        result: learningData.result,
        confidence_score: learningData.confidenceScore,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في تسجيل التعلم:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

export const getAILearningHistory = async (userId?: string, taskId?: string) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, data: [], source: 'local' };
    }

    let query = supabase
      .from('ai_learning_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [], source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب سجل التعلم:', error.message);
    return { success: false, data: [], error: error.message, source: 'local' };
  }
};

export const recordAIDecision = async (decision: {
  taskId?: string;
  logId?: string;
  decisionType: string;
  situation: any;
  availableOptions: any;
  selectedOption: string;
  reasoning: string;
  confidence: number;
}) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('ai_decisions')
      .insert({
        task_id: decision.taskId,
        log_id: decision.logId,
        decision_type: decision.decisionType,
        situation: decision.situation,
        available_options: decision.availableOptions,
        selected_option: decision.selectedOption,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في تسجيل القرار:', error.message);
    return { success: false, error: error.message, source: 'local' };
  }
};

// ========== إدارة الإعدادات Settings ==========

export const getUserSettings = async (userId: string) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      const localSettings = JSON.parse(localStorage.getItem('automation-settings') || '{}');
      return { success: true, data: localSettings, source: 'local' };
    }

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, data: data || {}, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب الإعدادات:', error.message);
    const localSettings = JSON.parse(localStorage.getItem('automation-settings') || '{}');
    return { success: false, data: localSettings, error: error.message, source: 'local' };
  }
};

export const saveUserSettings = async (userId: string, settings: any) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      localStorage.setItem('automation-settings', JSON.stringify(settings));
      return { success: true, source: 'local' };
    }

    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        github_token: settings.github?.token,
        github_repo: settings.github?.repo,
        github_owner: settings.github?.owner,
        github_branch: settings.github?.branch || 'main',
        stealth_settings: settings.stealth || {},
        execution_settings: settings.execution || {},
        notification_settings: settings.notifications || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, source: 'database' };
  } catch (error: any) {
    console.error('خطأ في حفظ الإعدادات:', error.message);
    localStorage.setItem('automation-settings', JSON.stringify(settings));
    return { success: false, error: error.message, source: 'local' };
  }
};

// ========== إحصائيات الأداء ==========

export const getPerformanceStats = async (userId: string, days: number = 30) => {
  try {
    const { connected } = await checkSupabaseStatus();
    if (!connected) {
      return { success: true, data: [], source: 'local' };
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from('performance_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', fromDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [], source: 'database' };
  } catch (error: any) {
    console.error('خطأ في جلب الإحصائيات:', error.message);
    return { success: false, data: [], error: error.message, source: 'local' };
  }
};

// ========== دوال مساعدة ==========

const mergeTasks = (localTasks: Task[], remoteTasks: any[]): Task[] => {
  const merged = new Map<string, Task>();

  // إضافة المهام المحلية
  localTasks.forEach(task => merged.set(task.id, task));

  // دمج مع المهام البعيدة (الأحدث يفوز)
  remoteTasks.forEach(remoteTask => {
    const local = merged.get(remoteTask.id);
    const remoteDate = new Date(remoteTask.updated_at);
    const localDate = local?.metadata?.updatedAt ? new Date(local.metadata.updatedAt) : new Date(0);

    if (!local || remoteDate > localDate) {
      merged.set(remoteTask.id, {
        id: remoteTask.id,
        name: remoteTask.name,
        description: remoteTask.description,
        type: remoteTask.type,
        status: remoteTask.status,
        script: remoteTask.script,
        targetUrl: remoteTask.target_url,
        schedule: remoteTask.schedule,
        createdAt: new Date(remoteTask.created_at),
        lastRun: remoteTask.last_run ? new Date(remoteTask.last_run) : undefined,
        metadata: remoteTask.metadata,
      });
    }
  });

  return Array.from(merged.values());
};

export default {
  checkSupabaseStatus,
  syncTasksWithDatabase,
  upsertTask,
  deleteTaskFromDatabase,
  saveExecutionLog,
  getExecutionLogs,
  getPublicTemplates,
  saveTemplate,
  getAIKnowledge,
  recordAILearning,
  getAILearningHistory,
  recordAIDecision,
  getUserSettings,
  saveUserSettings,
  getPerformanceStats,
};
