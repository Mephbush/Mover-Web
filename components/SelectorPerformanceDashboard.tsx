import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Layers,
  Activity,
} from 'lucide-react';

export interface SelectorMetric {
  selector: string;
  website: string;
  taskType: string;
  elementType: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageResponseTime: number;
  stabilityScore: number;
  recommendation: string;
  isReliable: boolean;
}

interface Props {
  metrics?: SelectorMetric[];
  isLoading?: boolean;
}

export function SelectorPerformanceDashboard({ metrics = [], isLoading = false }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<SelectorMetric | null>(null);
  const [filter, setFilter] = useState<'all' | 'reliable' | 'weak'>('all');

  const filteredMetrics = metrics.filter((m) => {
    if (filter === 'reliable') return m.isReliable;
    if (filter === 'weak') return m.successRate < 0.7;
    return true;
  });

  const stats = {
    totalSelectors: metrics.length,
    reliableSelectors: metrics.filter((m) => m.isReliable).length,
    weakSelectors: metrics.filter((m) => m.successRate < 0.7).length,
    averageSuccessRate:
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
        : 0,
    averageStability:
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.stabilityScore, 0) / metrics.length
        : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Zap className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات أداء المحددات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="flex items-center gap-2 mb-2 text-2xl font-bold">
            <BarChart3 className="w-8 h-8" />
            لوحة تحكم أداء المحددات
          </h2>
          <p className="text-muted-foreground">
            تتبع شامل لأداء جميع محددات العناصر وتحسينها تلقائياً
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي المحددات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSelectors}</div>
            <p className="text-xs text-muted-foreground mt-1">محدد عنصر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">محددات موثوقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.reliableSelectors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSelectors > 0
                ? ((stats.reliableSelectors / stats.totalSelectors) * 100).toFixed(0)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">محددات ضعيفة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.weakSelectors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">تحتاج تحسين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats.averageSuccessRate * 100).toFixed(1)}%
            </div>
            <Progress value={stats.averageSuccessRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">الاستقرار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats.averageStability * 100).toFixed(0)}%
            </div>
            <Progress value={stats.averageStability * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="reliable">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            موثوقة
          </TabsTrigger>
          <TabsTrigger value="weak">
            <AlertTriangle className="w-4 h-4 mr-2" />
            ضعيفة
          </TabsTrigger>
          <TabsTrigger value="details">
            <Layers className="w-4 h-4 mr-2" />
            التفاصيل
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء المحددات</CardTitle>
              <CardDescription>
                ترتيب المحددات حسب الأداء الكلية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.slice(0, 10).map((metric, idx) => (
                <div
                  key={metric.selector}
                  className="space-y-2 p-3 border rounded hover:bg-muted cursor-pointer transition"
                  onClick={() => setSelectedMetric(metric)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <span className="font-mono text-sm truncate">{metric.selector}</span>
                    </div>
                    {metric.isReliable ? (
                      <Badge className="bg-green-600">موثوق</Badge>
                    ) : metric.successRate < 0.6 ? (
                      <Badge variant="destructive">ضعيف</Badge>
                    ) : (
                      <Badge variant="secondary">متوسط</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>معدل النجاح</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {(metric.successRate * 100).toFixed(1)}%
                      </span>
                      <div className="w-32">
                        <Progress value={metric.successRate * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {metric.successCount}/{metric.totalAttempts} محاولات
                    </span>
                    <span className="text-xs">
                      ⏱️ {metric.averageResponseTime.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reliable Tab */}
        <TabsContent value="reliable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المحددات الموثوقة</CardTitle>
              <CardDescription>
                محددات ذات أداء عالية وثابتة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMetrics.filter((m) => m.isReliable).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد محددات موثوقة بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMetrics.filter((m) => m.isReliable).map((metric) => (
                    <div
                      key={metric.selector}
                      className="p-3 border rounded bg-green-50 dark:bg-green-950"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{metric.selector}</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {(metric.successRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metric.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weak Tab */}
        <TabsContent value="weak" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المحددات الضعيفة</CardTitle>
              <CardDescription>
                محددات تحتاج تحسين أو استبدال
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMetrics.filter((m) => !m.isReliable).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>جميع المحددات جيدة!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMetrics.filter((m) => !m.isReliable).map((metric) => (
                    <Alert key={metric.selector} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="font-mono text-sm">
                        {metric.selector}
                      </AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-1">
                          <div>
                            معدل النجاح: {(metric.successRate * 100).toFixed(1)}%
                          </div>
                          <div>
                            {metric.totalAttempts} محاولة ({metric.successCount} نجح)
                          </div>
                          <div className="text-sm mt-2">
                            💡 {metric.recommendation}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedMetric ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono break-all">
                  {selectedMetric.selector}
                </CardTitle>
                <CardDescription>
                  {selectedMetric.website} / {selectedMetric.taskType} /{' '}
                  {selectedMetric.elementType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">معدل النجاح</h4>
                    <span className="text-2xl font-bold">
                      {(selectedMetric.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={selectedMetric.successRate * 100} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedMetric.successCount} نجحت من {selectedMetric.totalAttempts}{' '}
                    محاولة
                  </p>
                </div>

                {/* Response Time */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <h4 className="font-semibold">سرعة الاستجابة</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">المتوسط</p>
                      <p className="text-2xl font-bold">
                        {selectedMetric.averageResponseTime.toFixed(0)}ms
                      </p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">الحد الأدنى</p>
                      <p className="text-2xl font-bold">100ms</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">الحد الأقصى</p>
                      <p className="text-2xl font-bold">5000ms</p>
                    </div>
                  </div>
                </div>

                {/* Stability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">درجة الاستقرار</h4>
                    <span className="text-2xl font-bold">
                      {(selectedMetric.stabilityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={selectedMetric.stabilityScore * 100} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedMetric.stabilityScore > 0.7
                      ? '✅ أداء مستقرة وثابتة'
                      : selectedMetric.stabilityScore > 0.4
                      ? '🟡 أداء متغيرة'
                      : '⚠️ أداء غير مستقرة'}
                  </p>
                </div>

                {/* Recommendation */}
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>التوصية</AlertTitle>
                  <AlertDescription>{selectedMetric.recommendation}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  اختر محدداً من القائمة لعرض التفاصيل
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
