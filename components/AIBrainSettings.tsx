import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Settings,
  Brain,
  BookOpen,
  Zap,
  Code,
  TrendingUp,
  Shield,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { databaseSync, AIBrainSettings as AISettings } from '../utils/ai-brain/database-sync';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';

export function AIBrainSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      await databaseSync.initialize(user!.id);
      const loadedSettings = await databaseSync.loadSettings();
      setSettings(loadedSettings);
    } catch (error: any) {
      toast.error('فشل تحميل الإعدادات: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await databaseSync.saveSettings(settings);
      setHasChanges(false);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      toast.error('فشل حفظ الإعدادات: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('هل تريد إعادة تعيين الإعدادات إلى الافتراضية؟')) {
      await loadSettings();
      setHasChanges(false);
      toast.success('تم إعادة تعيين الإعدادات');
    }
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>جاري تحميل الإعدادات...</p>
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
            <Settings className="w-8 h-8" />
            إعدادات عقل AI
          </h2>
          <p className="text-muted-foreground">
            تخصيص وضبط سلوك نظام الذكاء الاصطناعي
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            لديك تغييرات غير محفوظة. تذكر حفظ التغييرات قبل المغادرة.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="learning" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="learning">
            <TrendingUp className="w-4 h-4 mr-2" />
            التعلم
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="w-4 h-4 mr-2" />
            المعرفة
          </TabsTrigger>
          <TabsTrigger value="adaptation">
            <Zap className="w-4 h-4 mr-2" />
            التكيف
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="w-4 h-4 mr-2" />
            الأكواد
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Sliders className="w-4 h-4 mr-2" />
            متقدم
          </TabsTrigger>
        </TabsList>

        {/* Learning Settings */}
        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التعلم</CardTitle>
              <CardDescription>
                التحكم في كيفية تعلم الروبوت من التجارب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Enabled */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل التعلم</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح للروبوت بالتعلم من التجارب
                  </p>
                </div>
                <Switch
                  checked={settings.learning_enabled}
                  onCheckedChange={(checked) => updateSetting('learning_enabled', checked)}
                />
              </div>

              {/* Auto Learn */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التعلم التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    حفظ التجارب تلقائياً بدون تأكيد
                  </p>
                </div>
                <Switch
                  checked={settings.auto_learn}
                  onCheckedChange={(checked) => updateSetting('auto_learn', checked)}
                  disabled={!settings.learning_enabled}
                />
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>حد الثقة الأدنى</Label>
                  <Badge variant="outline">
                    {(settings.min_confidence_threshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  الحد الأدنى من الثقة لقبول التجربة
                </p>
                <Slider
                  value={[settings.min_confidence_threshold * 100]}
                  onValueChange={([value]) => 
                    updateSetting('min_confidence_threshold', value / 100)
                  }
                  min={0}
                  max={100}
                  step={5}
                  disabled={!settings.learning_enabled}
                />
              </div>

              {/* Max Experiences */}
              <div className="space-y-2">
                <Label>الحد الأقصى للتجارب لكل موقع</Label>
                <p className="text-sm text-muted-foreground">
                  عدد التجارب المحفوظة لكل موقع ويب
                </p>
                <Input
                  type="number"
                  value={settings.max_experiences_per_website}
                  onChange={(e) => 
                    updateSetting('max_experiences_per_website', parseInt(e.target.value))
                  }
                  min={100}
                  max={10000}
                  step={100}
                  disabled={!settings.learning_enabled}
                />
              </div>

              {/* Retention Days */}
              <div className="space-y-2">
                <Label>مدة الاحتفاظ بالتجارب (أيام)</Label>
                <p className="text-sm text-muted-foreground">
                  حذف التجارب الأقدم من هذه المدة تلقائياً
                </p>
                <Input
                  type="number"
                  value={settings.experience_retention_days}
                  onChange={(e) => 
                    updateSetting('experience_retention_days', parseInt(e.target.value))
                  }
                  min={7}
                  max={365}
                  step={7}
                  disabled={!settings.learning_enabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Settings */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قاعدة المعرفة</CardTitle>
              <CardDescription>
                إدارة كيفية تخزين واستخدام المعرفة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Knowledge Sharing */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>مشاركة المعرفة</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح بمشاركة المعرفة مع مستخدمين آخرين (قريباً)
                  </p>
                </div>
                <Switch
                  checked={settings.knowledge_sharing_enabled}
                  onCheckedChange={(checked) => 
                    updateSetting('knowledge_sharing_enabled', checked)
                  }
                  disabled
                />
              </div>

              {/* Auto Cleanup */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التنظيف التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    حذف المعرفة القديمة أو ذات الثقة المنخفضة
                  </p>
                </div>
                <Switch
                  checked={settings.auto_knowledge_cleanup}
                  onCheckedChange={(checked) => 
                    updateSetting('auto_knowledge_cleanup', checked)
                  }
                />
              </div>

              {/* Min Knowledge Confidence */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>حد الثقة الأدنى للمعرفة</Label>
                  <Badge variant="outline">
                    {(settings.min_knowledge_confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  المعرفة تحت هذا الحد سيتم حذفها عند التنظيف
                </p>
                <Slider
                  value={[settings.min_knowledge_confidence * 100]}
                  onValueChange={([value]) => 
                    updateSetting('min_knowledge_confidence', value / 100)
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {/* Max Knowledge Entries */}
              <div className="space-y-2">
                <Label>الحد الأقصى لإدخالات المعرفة</Label>
                <p className="text-sm text-muted-foreground">
                  إجمالي عدد إدخالات المعرفة المحفوظة
                </p>
                <Input
                  type="number"
                  value={settings.max_knowledge_entries}
                  onChange={(e) => 
                    updateSetting('max_knowledge_entries', parseInt(e.target.value))
                  }
                  min={1000}
                  max={50000}
                  step={1000}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adaptation Settings */}
        <TabsContent value="adaptation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التكيف</CardTitle>
              <CardDescription>
                كيفية تكيف الروبوت مع تغييرات المواقع
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Adaptation */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التكيف التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    تطبيق التكيفات تلقائياً عند اكتشاف تغييرات
                  </p>
                </div>
                <Switch
                  checked={settings.auto_adaptation_enabled}
                  onCheckedChange={(checked) => 
                    updateSetting('auto_adaptation_enabled', checked)
                  }
                />
              </div>

              {/* Require Confirmation */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>يتطلب تأكيد</Label>
                  <p className="text-sm text-muted-foreground">
                    طلب تأكيد قبل تطبيق التكيفات الكبيرة
                  </p>
                </div>
                <Switch
                  checked={settings.require_confirmation}
                  onCheckedChange={(checked) => 
                    updateSetting('require_confirmation', checked)
                  }
                  disabled={!settings.auto_adaptation_enabled}
                />
              </div>

              {/* Adaptation Sensitivity */}
              <div className="space-y-3">
                <Label>حساسية التكيف</Label>
                <p className="text-sm text-muted-foreground">
                  مدى سرعة استجابة النظام للتغييرات
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'aggressive'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={settings.adaptation_sensitivity === level ? 'default' : 'outline'}
                      onClick={() => updateSetting('adaptation_sensitivity', level)}
                      disabled={!settings.auto_adaptation_enabled}
                      className="capitalize"
                    >
                      {level === 'low' && 'منخفض'}
                      {level === 'medium' && 'متوسط'}
                      {level === 'high' && 'عالي'}
                      {level === 'aggressive' && 'قوي'}
                    </Button>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  الحساسية العالية قد تسبب تكيفات متكررة. استخدم "متوسط" للاستخدام العادي.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Intelligence Settings */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات ذكاء الأكواد</CardTitle>
              <CardDescription>
                التحكم في تحليل وإصلاح الأكواد تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Code Analysis */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تفعيل تحليل الأكواد</Label>
                  <p className="text-sm text-muted-foreground">
                    تحليل الأكواد للكشف عن الأخطاء
                  </p>
                </div>
                <Switch
                  checked={settings.code_analysis_enabled}
                  onCheckedChange={(checked) => 
                    updateSetting('code_analysis_enabled', checked)
                  }
                />
              </div>

              {/* Auto Fix */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>الإصلاح التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    إصلاح الأخطاء تلقائياً عند اكتشافها
                  </p>
                </div>
                <Switch
                  checked={settings.auto_fix_enabled}
                  onCheckedChange={(checked) => 
                    updateSetting('auto_fix_enabled', checked)
                  }
                  disabled={!settings.code_analysis_enabled}
                />
              </div>

              {/* Auto Fix Confidence */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>حد ثقة الإصلاح التلقائي</Label>
                  <Badge variant="outline">
                    {(settings.auto_fix_confidence_threshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  تطبيق الإصلاحات فقط إذا كانت الثقة أعلى من هذا الحد
                </p>
                <Slider
                  value={[settings.auto_fix_confidence_threshold * 100]}
                  onValueChange={([value]) => 
                    updateSetting('auto_fix_confidence_threshold', value / 100)
                  }
                  min={0}
                  max={100}
                  step={5}
                  disabled={!settings.auto_fix_enabled}
                />
              </div>

              {/* Code Quality Threshold */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>حد جودة الكود</Label>
                  <Badge variant="outline">
                    {settings.code_quality_threshold}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  الحد الأدنى لجودة الكود المقبول (0-100)
                </p>
                <Slider
                  value={[settings.code_quality_threshold]}
                  onValueChange={([value]) => 
                    updateSetting('code_quality_threshold', value)
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  الإصلاح التلقائي يساعد في الحفاظ على جودة عالية للأكواد المُنفذة.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات المتقدمة</CardTitle>
              <CardDescription>
                خيارات متقدمة للمستخدمين المحترفين
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">إعدادات الأداء</h3>
                
                <div className="space-y-2">
                  <Label>عدد محاولات الإعادة</Label>
                  <Input
                    type="number"
                    value={settings.max_retry_attempts}
                    onChange={(e) => 
                      updateSetting('max_retry_attempts', parseInt(e.target.value))
                    }
                    min={1}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>حجم دفعة التعلم</Label>
                  <Input
                    type="number"
                    value={settings.learning_batch_size}
                    onChange={(e) => 
                      updateSetting('learning_batch_size', parseInt(e.target.value))
                    }
                    min={10}
                    max={500}
                    step={10}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل التخزين المؤقت</Label>
                    <p className="text-sm text-muted-foreground">
                      تحسين الأداء عبر التخزين المؤقت
                    </p>
                  </div>
                  <Switch
                    checked={settings.cache_enabled}
                    onCheckedChange={(checked) => 
                      updateSetting('cache_enabled', checked)
                    }
                  />
                </div>

                {settings.cache_enabled && (
                  <div className="space-y-2">
                    <Label>مدة التخزين المؤقت (دقائق)</Label>
                    <Input
                      type="number"
                      value={settings.cache_ttl_minutes}
                      onChange={(e) => 
                        updateSetting('cache_ttl_minutes', parseInt(e.target.value))
                      }
                      min={5}
                      max={1440}
                      step={5}
                    />
                  </div>
                )}
              </div>

              {/* Experimental Features */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">ميزات تجريبية</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الميزات التجريبية</Label>
                    <p className="text-sm text-muted-foreground">
                      ميزات جديدة قيد التطوير (قد تكون غير مستقرة)
                    </p>
                  </div>
                  <Switch
                    checked={settings.experimental_features_enabled}
                    onCheckedChange={(checked) => 
                      updateSetting('experimental_features_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>وضع التصحيح</Label>
                    <p className="text-sm text-muted-foreground">
                      عرض معلومات إضافية للتصحيح
                    </p>
                  </div>
                  <Switch
                    checked={settings.debug_mode}
                    onCheckedChange={(checked) => 
                      updateSetting('debug_mode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل القياس عن بُعد</Label>
                    <p className="text-sm text-muted-foreground">
                      إرسال بيانات الاستخدام المجهولة للتحسين
                    </p>
                  </div>
                  <Switch
                    checked={settings.telemetry_enabled}
                    onCheckedChange={(checked) => 
                      updateSetting('telemetry_enabled', checked)
                    }
                  />
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  الميزات التجريبية قد تكون غير مستقرة. استخدمها بحذر في البيئة الإنتاجية.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
