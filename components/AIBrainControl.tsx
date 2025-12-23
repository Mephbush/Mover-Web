import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Brain,
  Settings,
  BarChart3,
  Zap,
  Database,
  Download,
  Upload,
  Power,
  PowerOff,
} from 'lucide-react';
import { AIBrainDashboard } from './AIBrainDashboard';
import { AIBrainSettings } from './AIBrainSettings';
import { AIBrainCustomization } from './AIBrainCustomization';
import { Alert, AlertDescription } from './ui/alert';
import { AIBrain } from '../utils/ai-brain';
import { useAuth } from '../hooks/useAuth';
import { toast } from "sonner";

export function AIBrainControl() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [autoInitialize, setAutoInitialize] = useState(true);

  // تهيئة تلقائية عند التحميل
  useEffect(() => {
    if (user && autoInitialize && !isInitialized && !isInitializing) {
      handleInitialize();
    }
  }, [user]);

  const handleInitialize = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsInitializing(true);
    try {
      const success = await AIBrain.initialize(user.id);
      
      if (success) {
        setIsInitialized(true);
        toast.success('تم تهيئة نظام عقل AI بنجاح');
        
        // تحميل حالة النظام
        const status = await AIBrain.getSystemStatus();
        setSystemStatus(status);
      } else {
        toast.error('فشل تهيئة النظام');
      }
    } catch (error: any) {
      toast.error('خطأ: ' + error.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleShutdown = () => {
    AIBrain.database.stopAutoSync();
    setIsInitialized(false);
    toast.info('تم إيقاف النظام');
  };

  const handleExport = async () => {
    try {
      const data = await AIBrain.exportAll();
      
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-brain-full-${Date.now()}.json`;
      a.click();
      
      toast.success('تم تصدير جميع البيانات');
    } catch (error: any) {
      toast.error('فشل التصدير: ' + error.message);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const success = await AIBrain.importAll(data);
      
      if (success) {
        toast.success('تم استيراد البيانات بنجاح');
        
        // تحديث حالة النظام
        const status = await AIBrain.getSystemStatus();
        setSystemStatus(status);
      } else {
        toast.error('فشل الاستيراد');
      }
    } catch (error: any) {
      toast.error('خطأ في الاستيراد: ' + error.message);
    }
  };

  const handleSelfImprovement = async () => {
    try {
      toast.info('بدء التحسين الذاتي...');
      
      const result = await AIBrain.comprehensiveSelfImprovement();
      
      toast.success(
        `تم التحسين بنجاح: ${result.insights.length} رؤى، ` +
        `${result.newKnowledge} معرفة جديدة، ` +
        `${result.cleanedRecords} سجل محذوف`
      );
      
      // تحديث حالة النظام
      const status = await AIBrain.getSystemStatus();
      setSystemStatus(status);
    } catch (error: any) {
      toast.error('فشل التحسين: ' + error.message);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('هل تريد حذف البيانات القديمة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      const deleted = await AIBrain.cleanup();
      toast.success(`تم حذف ${deleted} سجل قديم`);
    } catch (error: any) {
      toast.error('فشل التنظيف: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            يجب تسجيل الدخول لاستخدام نظام عقل AI
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Brain className="w-24 h-24 text-primary opacity-50" />
        <h2 className="text-2xl">نظام عقل الذكاء الاصطناعي</h2>
        <p className="text-muted-foreground text-center max-w-md">
          نظام شامل للتعلم الآلي، قاعدة المعرفة، التكيف الذكي، وتحليل الأكواد
        </p>
        <Button
          onClick={handleInitialize}
          disabled={isInitializing}
          size="lg"
          className="gap-2"
        >
          <Power className="w-5 h-5" />
          {isInitializing ? 'جاري التهيئة...' : 'تهيئة وتشغيل النظام'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-primary" />
            مركز التحكم في عقل AI
          </h2>
          <p className="text-muted-foreground">
            إدارة كاملة لنظام الذكاء الاصطناعي المتقدم
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSelfImprovement}
            variant="outline"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            تحسين ذاتي
          </Button>
          <Button
            onClick={handleCleanup}
            variant="outline"
            size="sm"
          >
            <Database className="w-4 h-4 mr-2" />
            تنظيف
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
          <Button variant="outline" size="sm" className="relative">
            <Upload className="w-4 h-4 mr-2" />
            استيراد
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
          <Button
            onClick={handleShutdown}
            variant="destructive"
            size="sm"
          >
            <PowerOff className="w-4 h-4 mr-2" />
            إيقاف
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                حالة النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  {systemStatus.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  v{systemStatus.version}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المزامنة</span>
                  <Badge variant={systemStatus.components.database.synced ? 'default' : 'secondary'}>
                    {systemStatus.components.database.synced ? 'نشطة' : 'متوقفة'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">تلقائي</span>
                  <Badge variant={systemStatus.components.database.autoSync ? 'default' : 'outline'}>
                    {systemStatus.components.database.autoSync ? 'مُفعل' : 'معطل'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                التعلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التجارب</span>
                  <span>{systemStatus.components.learning.experiences}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الأنماط</span>
                  <span>{systemStatus.components.learning.patterns}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                المعرفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإدخالات</span>
                  <span>{systemStatus.components.knowledge.entries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الفئات</span>
                  <span>{systemStatus.components.knowledge.categories}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            لوحة المعلومات
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="customization">
            <Zap className="w-4 h-4 mr-2" />
            التخصيص
          </TabsTrigger>
          <TabsTrigger value="info">
            <Brain className="w-4 h-4 mr-2" />
            معلومات النظام
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <AIBrainDashboard />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <AIBrainSettings />
        </TabsContent>

        {/* Customization Tab */}
        <TabsContent value="customization" className="space-y-4">
          <AIBrainCustomization />
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
              <CardDescription>
                تفاصيل تقنية عن نظام عقل الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemStatus ? (
                <div className="space-y-6">
                  {/* Components Status */}
                  <div>
                    <h3 className="mb-3">حالة المكونات</h3>
                    <div className="space-y-2">
                      {Object.entries(systemStatus.components).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${value.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="capitalize">{key}</span>
                          </div>
                          <Badge variant={value.active ? 'default' : 'secondary'}>
                            {value.active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h3 className="mb-3">مقاييس الأداء</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">معدل النجاح</p>
                        <p className="text-2xl">
                          {(systemStatus.components.performance.successRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">الثقة</p>
                        <p className="text-2xl">
                          {(systemStatus.components.performance.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">التعلم</p>
                        <p className="text-2xl">
                          {(systemStatus.components.performance.learningProgress * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">المعرفة</p>
                        <p className="text-2xl">
                          {(systemStatus.components.performance.knowledgeGrowth * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div>
                    <h3 className="mb-3">ملخص الإعدادات</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 border rounded">
                        <span>التعلم</span>
                        <Badge variant={systemStatus.settings.learning_enabled ? 'default' : 'secondary'}>
                          {systemStatus.settings.learning_enabled ? 'مُفعل' : 'معطل'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 border rounded">
                        <span>التكيف التلقائي</span>
                        <Badge variant={systemStatus.settings.auto_adaptation_enabled ? 'default' : 'secondary'}>
                          {systemStatus.settings.auto_adaptation_enabled ? 'مُفعل' : 'معطل'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 border rounded">
                        <span>تحليل الأكواد</span>
                        <Badge variant={systemStatus.settings.code_analysis_enabled ? 'default' : 'secondary'}>
                          {systemStatus.settings.code_analysis_enabled ? 'مُفعل' : 'معطل'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 border rounded">
                        <span>الإصلاح التلقائي</span>
                        <Badge variant={systemStatus.settings.auto_fix_enabled ? 'default' : 'secondary'}>
                          {systemStatus.settings.auto_fix_enabled ? 'مُفعل' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* System Info */}
                  <div>
                    <h3 className="mb-3">معلومات عامة</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الإصدار</span>
                        <span>{systemStatus.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحالة</span>
                        <Badge>{systemStatus.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">آخر تحديث</span>
                        <span>{new Date(systemStatus.timestamp).toLocaleString('ar')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">جاري تحميل معلومات النظام...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}