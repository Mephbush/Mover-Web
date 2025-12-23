import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  Clock,
  Calendar,
  Play,
  Pause,
  Trash2,
  Plus,
  Copy,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type { Task } from '../types';
import { toast } from 'sonner';

type ScheduleConfig = {
  id: string;
  taskId: string;
  taskName: string;
  enabled: boolean;
  type: 'once' | 'interval' | 'cron' | 'daily' | 'weekly';
  config: {
    time?: string; // HH:mm format
    interval?: number; // minutes
    cron?: string;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    date?: string; // YYYY-MM-DD
  };
  parallelInstances: number; // عدد النسخ المتوازية
  maxRetries: number;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
};

type RunningInstance = {
  id: string;
  scheduleId: string;
  taskName: string;
  instanceNumber: number;
  startTime: Date;
  status: 'running' | 'completed' | 'failed';
};

type TaskSchedulerProps = {
  tasks: Task[];
  onExecuteTask?: (taskId: string, instanceId?: string) => Promise<void>;
};

export function TaskScheduler({ tasks, onExecuteTask }: TaskSchedulerProps) {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [runningInstances, setRunningInstances] = useState<RunningInstance[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleConfig>>({
    type: 'interval',
    enabled: true,
    parallelInstances: 1,
    maxRetries: 3,
    config: {
      interval: 60,
    },
  });

  // تحميل الجداول المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('taskSchedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSchedules(parsed.map((s: any) => ({
          ...s,
          nextRun: s.nextRun ? new Date(s.nextRun) : undefined,
          lastRun: s.lastRun ? new Date(s.lastRun) : undefined,
        })));
      } catch (error) {
        console.error('Failed to load schedules:', error);
      }
    }
  }, []);

  // حفظ الجداول
  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem('taskSchedules', JSON.stringify(schedules));
    }
  }, [schedules]);

  // تشغيل الجداول
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndRunSchedules();
    }, 10000); // فحص كل 10 ثواني

    return () => clearInterval(interval);
  }, [schedules]);

  const checkAndRunSchedules = async () => {
    const now = new Date();
    
    for (const schedule of schedules) {
      if (!schedule.enabled || schedule.status === 'paused') continue;
      
      if (shouldRun(schedule, now)) {
        await executeSchedule(schedule);
      }
    }
  };

  const shouldRun = (schedule: ScheduleConfig, now: Date): boolean => {
    if (!schedule.nextRun) {
      // حساب وقت التشغيل التالي
      updateNextRun(schedule);
      return false;
    }

    return now >= schedule.nextRun;
  };

  const updateNextRun = (schedule: ScheduleConfig) => {
    const now = new Date();
    let nextRun: Date | undefined;

    switch (schedule.type) {
      case 'once':
        if (schedule.config.date && schedule.config.time) {
          nextRun = new Date(`${schedule.config.date}T${schedule.config.time}`);
        }
        break;

      case 'interval':
        if (schedule.config.interval) {
          nextRun = new Date(now.getTime() + schedule.config.interval * 60000);
        }
        break;

      case 'daily':
        if (schedule.config.time) {
          nextRun = new Date(now);
          const [hours, minutes] = schedule.config.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        }
        break;

      case 'weekly':
        if (schedule.config.time && schedule.config.daysOfWeek?.length) {
          nextRun = getNextWeeklyRun(now, schedule.config.time, schedule.config.daysOfWeek);
        }
        break;
    }

    if (nextRun) {
      setSchedules(prev =>
        prev.map(s => s.id === schedule.id ? { ...s, nextRun } : s)
      );
    }
  };

  const getNextWeeklyRun = (from: Date, time: string, daysOfWeek: number[]): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(from);
    result.setHours(hours, minutes, 0, 0);

    // البحث عن اليوم التالي المطابق
    for (let i = 0; i < 7; i++) {
      const testDate = new Date(result);
      testDate.setDate(result.getDate() + i);
      
      if (daysOfWeek.includes(testDate.getDay()) && testDate > from) {
        return testDate;
      }
    }

    // إذا لم نجد، نبحث في الأسبوع التالي
    result.setDate(result.getDate() + 7);
    return result;
  };

  const executeSchedule = async (schedule: ScheduleConfig) => {
    // تنفيذ نسخ متوازية
    const instances: RunningInstance[] = [];
    
    for (let i = 0; i < schedule.parallelInstances; i++) {
      const instance: RunningInstance = {
        id: `${schedule.id}-${Date.now()}-${i}`,
        scheduleId: schedule.id,
        taskName: schedule.taskName,
        instanceNumber: i + 1,
        startTime: new Date(),
        status: 'running',
      };
      
      instances.push(instance);
    }

    setRunningInstances(prev => [...prev, ...instances]);

    // تنفيذ كل نسخة
    const promises = instances.map(async (instance) => {
      try {
        if (onExecuteTask) {
          await onExecuteTask(schedule.taskId, instance.id);
        }
        
        // تحديث حالة النسخة
        setRunningInstances(prev =>
          prev.map(i => i.id === instance.id ? { ...i, status: 'completed' } : i)
        );
        
        return true;
      } catch (error) {
        setRunningInstances(prev =>
          prev.map(i => i.id === instance.id ? { ...i, status: 'failed' } : i)
        );
        return false;
      }
    });

    await Promise.all(promises);

    // تحديث الجدول
    setSchedules(prev =>
      prev.map(s => {
        if (s.id === schedule.id) {
          const updated = {
            ...s,
            lastRun: new Date(),
            runCount: s.runCount + 1,
          };
          
          // تحديث وقت التشغيل التالي
          if (s.type === 'once') {
            updated.status = 'completed';
            updated.enabled = false;
          } else {
            updateNextRun(updated);
          }
          
          return updated;
        }
        return s;
      })
    );

    // إزالة النسخ المكتملة بعد 30 ثانية
    setTimeout(() => {
      setRunningInstances(prev =>
        prev.filter(i => !instances.find(inst => inst.id === i.id))
      );
    }, 30000);
  };

  const createSchedule = () => {
    if (!newSchedule.taskId) {
      toast.error('الرجاء اختيار مهمة');
      return;
    }

    const task = tasks.find(t => t.id === newSchedule.taskId);
    if (!task) return;

    const schedule: ScheduleConfig = {
      id: Date.now().toString(),
      taskId: task.id,
      taskName: task.name,
      enabled: newSchedule.enabled ?? true,
      type: newSchedule.type as any,
      config: newSchedule.config!,
      parallelInstances: newSchedule.parallelInstances ?? 1,
      maxRetries: newSchedule.maxRetries ?? 3,
      runCount: 0,
      status: 'active',
    };

    updateNextRun(schedule);
    setSchedules(prev => [...prev, schedule]);
    setIsCreating(false);
    setNewSchedule({
      type: 'interval',
      enabled: true,
      parallelInstances: 1,
      maxRetries: 3,
      config: { interval: 60 },
    });
    
    toast.success('تم إنشاء الجدول بنجاح');
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('تم حذف الجدول');
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev =>
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const duplicateSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      const duplicate: ScheduleConfig = {
        ...schedule,
        id: Date.now().toString(),
        taskName: `${schedule.taskName} (نسخة)`,
        runCount: 0,
        lastRun: undefined,
        nextRun: undefined,
      };
      updateNextRun(duplicate);
      setSchedules(prev => [...prev, duplicate]);
      toast.success('تم نسخ الجدول');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Clock className="w-8 h-8 text-primary" />
            جدولة المهام المتقدمة
          </h2>
          <p className="text-muted-foreground">
            جدولة تلقائية مع دعم التنفيذ المتوازي والتكرار
          </p>
        </div>

        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          جدولة جديدة
        </Button>
      </div>

      {/* Running Instances */}
      {runningInstances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              التنفيذات الجارية ({runningInstances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {runningInstances.map(instance => (
                <div
                  key={instance.id}
                  className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{instance.taskName}</span>
                    <Badge variant="outline">نسخة {instance.instanceNumber}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {instance.status === 'running' && (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    )}
                    {instance.status === 'completed' && (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                    {instance.status === 'failed' && (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span>{instance.startTime.toLocaleTimeString('ar')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Schedule Dialog */}
      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>إنشاء جدولة جديدة</CardTitle>
            <CardDescription>
              قم بتكوين جدولة تلقائية للمهمة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Selection */}
            <div className="space-y-2">
              <Label>المهمة</Label>
              <Select
                value={newSchedule.taskId}
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, taskId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مهمة" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label>نوع الجدولة</Label>
              <Select
                value={newSchedule.type}
                onValueChange={(value: any) => setNewSchedule(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">مرة واحدة</SelectItem>
                  <SelectItem value="interval">كل فترة زمنية</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific Configuration */}
            {newSchedule.type === 'interval' && (
              <div className="space-y-2">
                <Label>الفترة (بالدقائق)</Label>
                <Input
                  type="number"
                  value={newSchedule.config?.interval || 60}
                  onChange={(e) => setNewSchedule(prev => ({
                    ...prev,
                    config: { ...prev.config, interval: parseInt(e.target.value) }
                  }))}
                  min="1"
                />
              </div>
            )}

            {(newSchedule.type === 'daily' || newSchedule.type === 'weekly') && (
              <div className="space-y-2">
                <Label>الوقت</Label>
                <Input
                  type="time"
                  value={newSchedule.config?.time || '09:00'}
                  onChange={(e) => setNewSchedule(prev => ({
                    ...prev,
                    config: { ...prev.config, time: e.target.value }
                  }))}
                />
              </div>
            )}

            {newSchedule.type === 'once' && (
              <>
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={newSchedule.config?.date || ''}
                    onChange={(e) => setNewSchedule(prev => ({
                      ...prev,
                      config: { ...prev.config, date: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوقت</Label>
                  <Input
                    type="time"
                    value={newSchedule.config?.time || '09:00'}
                    onChange={(e) => setNewSchedule(prev => ({
                      ...prev,
                      config: { ...prev.config, time: e.target.value }
                    }))}
                  />
                </div>
              </>
            )}

            {/* Parallel Instances */}
            <div className="space-y-2">
              <Label>عدد النسخ المتوازية</Label>
              <Input
                type="number"
                value={newSchedule.parallelInstances || 1}
                onChange={(e) => setNewSchedule(prev => ({
                  ...prev,
                  parallelInstances: parseInt(e.target.value)
                }))}
                min="1"
                max="10"
              />
              <p className="text-xs text-muted-foreground">
                تشغيل نفس المهمة عدة مرات في نفس الوقت
              </p>
            </div>

            {/* Max Retries */}
            <div className="space-y-2">
              <Label>عدد المحاولات عند الفشل</Label>
              <Input
                type="number"
                value={newSchedule.maxRetries || 3}
                onChange={(e) => setNewSchedule(prev => ({
                  ...prev,
                  maxRetries: parseInt(e.target.value)
                }))}
                min="0"
                max="10"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={createSchedule}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                إنشاء الجدولة
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>الجداول المُفعلة ({schedules.filter(s => s.enabled).length}/{schedules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد جداول بعد</p>
              <p className="text-sm">أنشئ جدولة جديدة لبدء الأتمتة</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {schedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`p-4 border rounded-lg ${
                      schedule.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4>{schedule.taskName}</h4>
                          <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                            {schedule.enabled ? 'نشط' : 'متوقف'}
                          </Badge>
                          {schedule.parallelInstances > 1 && (
                            <Badge variant="outline">
                              {schedule.parallelInstances}× متوازي
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {schedule.type === 'once' && 'مرة واحدة'}
                              {schedule.type === 'interval' && `كل ${schedule.config.interval} دقيقة`}
                              {schedule.type === 'daily' && `يومياً في ${schedule.config.time}`}
                              {schedule.type === 'weekly' && `أسبوعياً في ${schedule.config.time}`}
                            </span>
                          </div>
                          {schedule.nextRun && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                التشغيل التالي: {schedule.nextRun.toLocaleString('ar')}
                              </span>
                            </div>
                          )}
                          {schedule.lastRun && (
                            <div className="flex items-center gap-2 text-xs">
                              آخر تشغيل: {schedule.lastRun.toLocaleString('ar')} | عدد المرات: {schedule.runCount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSchedule(schedule.id)}
                        >
                          {schedule.enabled ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateSchedule(schedule.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
