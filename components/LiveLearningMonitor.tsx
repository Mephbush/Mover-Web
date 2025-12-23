import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import {
  Brain,
  TrendingUp,
  Activity,
  Zap,
  Target,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import { learningEngine } from '../utils/ai-brain/learning-engine';
import { knowledgeBase } from '../utils/ai-brain/knowledge-base';

type LearningEvent = {
  id: string;
  timestamp: Date;
  type: 'success' | 'failure' | 'pattern' | 'knowledge';
  message: string;
  details?: any;
};

export function LiveLearningMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    successes: 0,
    failures: 0,
    patternsLearned: 0,
    knowledgeGained: 0,
  });
  const [recentExperiences, setRecentExperiences] = useState<any[]>([]);
  const [learningRate, setLearningRate] = useState(0);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        updateMonitorData();
      }, 2000); // تحديث كل ثانيتين

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const updateMonitorData = async () => {
    try {
      // جلب آخر التجارب
      const allExperiences = learningEngine.getAllExperiences();
      const recent = allExperiences.slice(-10).reverse();
      setRecentExperiences(recent);

      // حساب الإحصائيات
      const successCount = allExperiences.filter((e: any) => e.success).length;
      const failureCount = allExperiences.filter((e: any) => !e.success).length;
      const patterns = learningEngine.getAllPatterns();
      const knowledge = knowledgeBase.getAllEntries();

      setStats({
        totalEvents: allExperiences.length,
        successes: successCount,
        failures: failureCount,
        patternsLearned: patterns.length,
        knowledgeGained: knowledge.length,
      });

      // حساب معدل التعلم
      if (allExperiences.length > 0) {
        const rate = (successCount / allExperiences.length) * 100;
        setLearningRate(rate);
      }

      // إضافة أحداث جديدة
      if (recent.length > 0 && events.length === 0) {
        const newEvents: LearningEvent[] = recent.map((exp: any) => ({
          id: exp.id || Date.now().toString(),
          timestamp: new Date(exp.timestamp),
          type: exp.success ? 'success' : 'failure',
          message: exp.success 
            ? `نجاح: ${exp.action} على ${exp.website}` 
            : `فشل: ${exp.action} - ${exp.error}`,
          details: exp,
        }));
        setEvents(newEvents);
      }
    } catch (error) {
      console.error('Failed to update monitor data:', error);
    }
  };

  const addLearningEvent = (event: Omit<LearningEvent, 'id' | 'timestamp'>) => {
    const newEvent: LearningEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...event,
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // الاحتفاظ بآخر 50 حدث
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Activity className="w-8 h-8 text-primary animate-pulse" />
            مراقبة التعلم المباشر
          </h2>
          <p className="text-muted-foreground">
            تتبع تعلم الروبوت وتطوره في الوقت الفعلي
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? 'default' : 'outline'}
            size="sm"
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                إيقاف مؤقت
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                استئناف
              </>
            )}
          </Button>
          <Button onClick={updateMonitorData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button onClick={clearEvents} variant="outline" size="sm">
            مسح السجل
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي الأحداث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              نجاحات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.successes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              إخفاقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{stats.failures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              أنماط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600">{stats.patternsLearned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              معرفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-purple-600">{stats.knowledgeGained}</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            معدل النجاح الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-2xl">{learningRate.toFixed(1)}%</span>
              <Badge variant={learningRate >= 70 ? 'default' : learningRate >= 50 ? 'secondary' : 'destructive'}>
                {learningRate >= 70 ? 'ممتاز' : learningRate >= 50 ? 'جيد' : 'يحتاج تحسين'}
              </Badge>
            </div>
            <Progress value={learningRate} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Experiences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              آخر التجارب
            </CardTitle>
            <CardDescription>
              {isMonitoring && <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                مباشر
              </span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {recentExperiences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تجارب بعد</p>
                  </div>
                ) : (
                  recentExperiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded-lg ${
                        exp.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {exp.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm">{exp.action}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {exp.confidenceScore ? `${(exp.confidenceScore * 100).toFixed(0)}%` : 'N/A'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>الموقع: {exp.website || 'غير محدد'}</p>
                        {exp.selector && <p>المحدد: {exp.selector}</p>}
                        {exp.error && <p className="text-red-600">خطأ: {exp.error}</p>}
                        <p className="text-xs opacity-70">
                          {new Date(exp.timestamp).toLocaleString('ar')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Live Events Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              سجل الأحداث المباشر
            </CardTitle>
            <CardDescription>
              تحديثات فورية لنشاط التعلم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>في انتظار الأحداث...</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 border rounded text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {event.type === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {event.type === 'failure' && <XCircle className="w-3 h-3 text-red-500" />}
                        {event.type === 'pattern' && <Target className="w-3 h-3 text-blue-500" />}
                        {event.type === 'knowledge' && <Brain className="w-3 h-3 text-purple-500" />}
                        <span className="text-xs text-muted-foreground">
                          {event.timestamp.toLocaleTimeString('ar')}
                        </span>
                      </div>
                      <p className="text-sm">{event.message}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            رؤى التعلم
          </CardTitle>
          <CardDescription>
            تحليل تلقائي لأداء التعلم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {learningRate >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✨ الأداء ممتاز! الروبوت يتعلم بشكل فعال جداً
                </p>
              </div>
            )}
            {learningRate >= 50 && learningRate < 80 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  📈 الأداء جيد، يمكن تحسين بعض الجوانب
                </p>
              </div>
            )}
            {learningRate < 50 && stats.totalEvents > 5 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ معدل النجاح منخفض، يُنصح بمراجعة الإعدادات
                </p>
              </div>
            )}
            {stats.patternsLearned > 10 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  🎯 تم تعلم {stats.patternsLearned} نمط م��تلف - قاعدة معرفة قوية!
                </p>
              </div>
            )}
            {stats.totalEvents === 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 ابدأ بتشغيل بعض المهام لبدء عملية التعلم
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
