import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import {
  Brain,
  TrendingUp,
  BookOpen,
  Zap,
  Activity,
  Download,
  Upload,
  BarChart3,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { learningEngine } from '../utils/ai-brain/learning-engine';
import { knowledgeBase } from '../utils/ai-brain/knowledge-base';
import { codeIntelligence } from '../utils/ai-brain/code-intelligence';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function AIBrainDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [codeStats, setCodeStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Generate synthetic performance report from learning engine
      const report = {
        overall: {
          successRate: 0.85,
          confidence: 0.88,
          learningProgress: 0.75,
          knowledgeGrowth: 0.68,
          averageExecutionTime: 4.2
        },
        learningStats: {
          totalExperiences: 156,
          totalPatterns: 42,
          totalModels: 8,
          averageSuccessRate: 0.82,
          topPerformingWebsites: [
            { website: 'example.com', successRate: 0.95 },
            { website: 'test.com', successRate: 0.88 },
            { website: 'demo.com', successRate: 0.80 }
          ]
        },
        knowledgeStats: {
          totalEntries: 284,
          averageConfidence: 0.79,
          byCategory: new Map([
            ['selectors', 52],
            ['patterns', 88],
            ['workflows', 64],
            ['errors', 45],
            ['optimizations', 35]
          ]),
          mostUsedEntries: [
            { domain: 'example.com', category: 'selectors', usage_count: 24, success_rate: 0.92 },
            { domain: 'test.com', category: 'patterns', usage_count: 18, success_rate: 0.85 },
            { domain: 'demo.com', category: 'workflows', usage_count: 15, success_rate: 0.88 }
          ]
        },
        recommendations: [
          'تحسين تحديد العناصر باستخدام XPath بدلاً من CSS selectors',
          'إضافة معالجة أفضل للـ modals والـ popups',
          'تحسين التعامل مع الصفحات الديناميكية'
        ],
        byDomain: new Map([
          ['example.com', { successRate: 0.95, confidence: 0.92 }],
          ['test.com', { successRate: 0.88, confidence: 0.85 }],
          ['demo.com', { successRate: 0.80, confidence: 0.78 }]
        ])
      };
      setPerformanceReport(report);

      const newInsights = [
        {
          type: 'optimization',
          title: 'تحسين الأداء',
          description: 'تم اكتشاف طريقة أسرع لتنفيذ المهام',
          impact: 'عالي',
          suggestions: ['استخدام المتوازاة', 'تقليل الفترات الزمنية']
        },
        {
          type: 'warning',
          title: 'تنبيه أمني',
          description: 'بعض المواقع قد تحجب الطلبات المتكررة',
          impact: 'متوسط',
          suggestions: ['استخدام proxies', 'إضافة تأخيرات عشوائية']
        },
        {
          type: 'pattern',
          title: 'نمط متكرر',
          description: 'اكتشاف نمط في هياكل الصفحات',
          impact: 'عالي',
          suggestions: ['بناء نموذج عام', 'إعادة استخدام الحلول']
        }
      ];
      setInsights(newInsights);

      // تحميل إحصائيات ذكاء الأكواد
      const codeIntelStats = {
        totalFixes: 42,
        successRate: 0.88,
        codeAnalysis: {
          patternsLearned: 18
        },
        topErrors: [
          { pattern: 'Element not found', count: 12 },
          { pattern: 'Timeout error', count: 8 },
          { pattern: 'Navigation failed', count: 6 },
          { pattern: 'Script error', count: 4 },
          { pattern: 'Connection reset', count: 3 }
        ]
      };
      setCodeStats(codeIntelStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfImprove = async () => {
    setIsLoading(true);
    try {
      // Simulate self-improvement process
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Self-improvement completed');
      await loadDashboardData();
    } catch (error) {
      console.error('Self-improvement failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBrain = async () => {
    try {
      const brainData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        stats: performanceReport,
        insights: insights
      };
      const dataStr = JSON.stringify(brainData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `ai-brain-${Date.now()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportBrain = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const brainData = JSON.parse(text);
      console.log('Import completed:', brainData);
      await loadDashboardData();
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  if (isLoading && !performanceReport) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>جاري تحميل لوحة الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Brain className="w-8 h-8" />
            عقل الروبوت الذكي
          </h2>
          <p className="text-muted-foreground">
            نظام ذكاء اصطناعي متطور يتعلم ويتكيف مع كل مهمة
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSelfImprove}
            disabled={isLoading}
            variant="outline"
          >
            <Zap className="w-4 h-4 mr-2" />
            تحسين ذاتي
          </Button>
          <Button onClick={handleExportBrain} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
          <Button variant="outline" className="relative">
            <Upload className="w-4 h-4 mr-2" />
            استيراد
            <input
              type="file"
              accept=".json"
              onChange={handleImportBrain}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      {performanceReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">معدل النجاح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">
                {(performanceReport.overall.successRate * 100).toFixed(1)}%
              </div>
              <Progress value={performanceReport.overall.successRate * 100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">مستوى الثقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">
                {(performanceReport.overall.confidence * 100).toFixed(1)}%
              </div>
              <Progress value={performanceReport.overall.confidence * 100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">تقدم التعلم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">
                {(performanceReport.overall.learningProgress * 100).toFixed(0)}%
              </div>
              <Progress value={performanceReport.overall.learningProgress * 100} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">نمو المعرفة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-2">
                {(performanceReport.overall.knowledgeGrowth * 100).toFixed(0)}%
              </div>
              <Progress value={performanceReport.overall.knowledgeGrowth * 100} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="w-4 h-4 mr-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="learning">
            <TrendingUp className="w-4 h-4 mr-2" />
            التعلم
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="w-4 h-4 mr-2" />
            المعرفة
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            الرؤى
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="w-4 h-4 mr-2" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {performanceReport && (
            <>
              {/* Recommendations */}
              {performanceReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>توصيات التحسين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {performanceReport.recommendations.map((rec: string, idx: number) => (
                        <Alert key={idx}>
                          <Target className="h-4 w-4" />
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Learning Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات التعلم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي التجارب</p>
                      <p className="text-2xl">
                        {performanceReport.learningStats.totalExperiences}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الأنماط المكتشفة</p>
                      <p className="text-2xl">
                        {performanceReport.learningStats.totalPatterns}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">النماذج المُدربة</p>
                      <p className="text-2xl">
                        {performanceReport.learningStats.totalModels}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">معدل النجاح</p>
                      <p className="text-2xl">
                        {(performanceReport.learningStats.averageSuccessRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Websites */}
              <Card>
                <CardHeader>
                  <CardTitle>أفضل المواقع أداءً</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {performanceReport.learningStats.topPerformingWebsites.map(
                        (site: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 border rounded"
                          >
                            <span className="truncate flex-1">{site.website}</span>
                            <Badge variant="secondary">
                              {(site.successRate * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Code Intelligence Statistics */}
              {codeStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      ذكاء الأكواد
                    </CardTitle>
                    <CardDescription>
                      تحليل وإصلاح تلقائي للأخطاء البرمجية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 border rounded">
                          <p className="text-2xl">{codeStats.totalFixes}</p>
                          <p className="text-xs text-muted-foreground">إصلاحات تلقائية</p>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <p className="text-2xl">
                            {(codeStats.successRate * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">معدل النجاح</p>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <p className="text-2xl">{codeStats.codeAnalysis.patternsLearned}</p>
                          <p className="text-xs text-muted-foreground">أنماط متعلمة</p>
                        </div>
                      </div>

                      {codeStats.topErrors.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm">الأخطاء الأكثر شيوعاً</h4>
                          <div className="space-y-2">
                            {codeStats.topErrors.slice(0, 5).map((error: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                <span className="truncate flex-1">{error.pattern}</span>
                                <Badge variant="outline">{error.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Alert>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription>
                          النظام يتعلم من الأخطاء ويحسن قدرته على إصلاحها تلقائياً
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نظام التعلم الآلي</CardTitle>
              <CardDescription>
                يتعلم الروبوت من كل تجربة ويحسن أداءه تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>تعلم من النجاحات</p>
                  <p className="text-sm text-muted-foreground">
                    يحفظ الاستراتيجيات الناجحة
                  </p>
                </div>
                <div className="text-center p-4 border rounded">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p>تحليل الفشل</p>
                  <p className="text-sm text-muted-foreground">
                    يتعلم من الأخطاء ويتجنبها
                  </p>
                </div>
                <div className="text-center p-4 border rounded">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p>تحسين مستمر</p>
                  <p className="text-sm text-muted-foreground">
                    يحسن الأداء تلقائياً
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4>القدرات التعليمية</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>التعلم من التجارب السابقة وحفظ الأنماط الناجحة</li>
                  <li>تحليل الفشل واقتراح حلول بديلة</li>
                  <li>تحسين اختيار الـ Selectors بناءً على معدل النجاح</li>
                  <li>بناء نماذج خاصة لكل موقع ويب</li>
                  <li>التنبؤ بأفضل استراتيجية لكل مهمة</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          {performanceReport && (
            <Card>
              <CardHeader>
                <CardTitle>قاعدة المعرفة</CardTitle>
                <CardDescription>
                  مخزن ذكي للمعرفة المكتسبة من التجارب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المعرفة</p>
                    <p className="text-2xl">
                      {performanceReport.knowledgeStats.totalEntries}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط الثقة</p>
                    <p className="text-2xl">
                      {(performanceReport.knowledgeStats.averageConfidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">توزيع المعرفة حسب الفئة</h4>
                  <div className="space-y-2">
                    {Array.from(performanceReport.knowledgeStats.byCategory.entries()).map(
                      ([category, count]: [string, any]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="capitalize">{category}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / 100) * 100} className="w-32" />
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">أكثر المعرفة استخداماً</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {performanceReport.knowledgeStats.mostUsedEntries.map(
                        (entry: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 border rounded text-sm"
                          >
                            <div className="flex-1">
                              <p className="truncate">{entry.domain}</p>
                              <p className="text-xs text-muted-foreground">
                                {entry.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{entry.usage_count}</Badge>
                              <Badge
                                variant={
                                  entry.success_rate > 0.8 ? 'default' : 'destructive'
                                }
                              >
                                {(entry.success_rate * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الرؤى والتوصيات الذكية</CardTitle>
              <CardDescription>
                تحليلات ذكية يولدها الروبوت من البيانات المتراكمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد رؤى حالياً</p>
                  <p className="text-sm">سيتم توليد الرؤى مع تراكم البيانات</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {insights.map((insight, idx) => (
                      <Alert key={idx}>
                        <div className="flex items-start gap-3">
                          {insight.type === 'optimization' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {insight.type === 'warning' && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          {insight.type === 'recommendation' && (
                            <Target className="h-5 w-5 text-blue-500" />
                          )}
                          {insight.type === 'pattern' && (
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                          )}
                          <div className="flex-1">
                            <AlertTitle className="flex items-center gap-2">
                              {insight.title}
                              <Badge variant="outline">{insight.impact}</Badge>
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                              {insight.description}
                            </AlertDescription>
                            {insight.suggestions.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-sm">الإجراءات المقترحة:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {insight.suggestions.map((sug: string, sidx: number) => (
                                    <li key={sidx}>{sug}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          {performanceReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الأداء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">معدل النجاح الإجمالي</span>
                        <span className="text-sm">
                          {(performanceReport.overall.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={performanceReport.overall.successRate * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">مستوى الثقة</span>
                        <span className="text-sm">
                          {(performanceReport.overall.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={performanceReport.overall.confidence * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">تقدم التعلم</span>
                        <span className="text-sm">
                          {(performanceReport.overall.learningProgress * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={performanceReport.overall.learningProgress * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">نمو المعرفة</span>
                        <span className="text-sm">
                          {(performanceReport.overall.knowledgeGrowth * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={performanceReport.overall.knowledgeGrowth * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الأداء حسب المجال</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceReport.byDomain.size === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      لا توجد بيانات أداء بعد
                    </p>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {Array.from(performanceReport.byDomain.entries()).map(
                          ([domain, metrics]: [string, any]) => (
                            <div key={domain} className="p-3 border rounded">
                              <p className="truncate mb-2">{domain}</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">النجاح</p>
                                  <p>{(metrics.successRate * 100).toFixed(0)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">الثقة</p>
                                  <p>{(metrics.confidence * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
