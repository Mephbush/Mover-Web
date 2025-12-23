import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Brain,
  Cpu,
  Zap,
  Target,
  Gauge,
  Sliders,
  Save,
  RotateCcw,
  Sparkles,
  Activity,
  Settings2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Database,
  Code,
  BookOpen,
} from 'lucide-react';
import { databaseSync } from '../utils/ai-brain/database-sync';
import { useAuth } from '../hooks/useAuth';
import { toast } from "sonner";

interface AIPersonality {
  name: string;
  description: string;
  settings: {
    aggressiveness: number;
    creativity: number;
    cautiousness: number;
    learningSpeed: number;
  };
}

const PERSONALITIES: AIPersonality[] = [
  {
    name: 'متوازن',
    description: 'توازن مثالي بين السرعة والدقة',
    settings: {
      aggressiveness: 50,
      creativity: 50,
      cautiousness: 50,
      learningSpeed: 50,
    },
  },
  {
    name: 'سريع',
    description: 'أداء سريع مع تقليل التحققات',
    settings: {
      aggressiveness: 80,
      creativity: 60,
      cautiousness: 30,
      learningSpeed: 70,
    },
  },
  {
    name: 'دقيق',
    description: 'دقة عالية مع تحققات مكثفة',
    settings: {
      aggressiveness: 30,
      creativity: 40,
      cautiousness: 80,
      learningSpeed: 40,
    },
  },
  {
    name: 'مبتكر',
    description: 'إبداعي في حل المشاكل',
    settings: {
      aggressiveness: 60,
      creativity: 90,
      cautiousness: 40,
      learningSpeed: 80,
    },
  },
  {
    name: 'محافظ',
    description: 'طرق مجربة وآمنة فقط',
    settings: {
      aggressiveness: 20,
      creativity: 30,
      cautiousness: 90,
      learningSpeed: 30,
    },
  },
];

interface CustomBehavior {
  aggressiveness: number;
  creativity: number;
  cautiousness: number;
  learningSpeed: number;
  errorTolerance: number;
  retryStrategy: 'immediate' | 'exponential' | 'linear' | 'adaptive';
  decisionMaking: 'fast' | 'balanced' | 'thorough';
  adaptationStyle: 'aggressive' | 'moderate' | 'conservative';
}

export function AIBrainCustomization() {
  const { user } = useAuth();
  const [selectedPersonality, setSelectedPersonality] = useState<string>('متوازن');
  const [customBehavior, setCustomBehavior] = useState<CustomBehavior>({
    aggressiveness: 50,
    creativity: 50,
    cautiousness: 50,
    learningSpeed: 50,
    errorTolerance: 50,
    retryStrategy: 'exponential',
    decisionMaking: 'balanced',
    adaptationStyle: 'moderate',
  });
  const [advancedSettings, setAdvancedSettings] = useState({
    maxMemoryUsage: 100,
    maxConcurrentTasks: 5,
    taskPriority: 'balanced',
    dataRetentionDays: 90,
    knowledgeUpdateFrequency: 'daily',
    selfImprovementEnabled: true,
    patternRecognitionSensitivity: 70,
    anomalyDetectionThreshold: 80,
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomization();
  }, [user]);

  const loadCustomization = async () => {
    if (!user) return;
    try {
      // تحميل الإعدادات المخصصة من قاعدة البيانات
      const stored = localStorage.getItem(`ai-brain-customization-${user.id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setCustomBehavior(data.customBehavior || customBehavior);
        setAdvancedSettings(data.advancedSettings || advancedSettings);
        setCustomInstructions(data.customInstructions || '');
        setSelectedPersonality(data.selectedPersonality || 'متوازن');
      }
    } catch (error) {
      console.error('Failed to load customization:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const data = {
        selectedPersonality,
        customBehavior,
        advancedSettings,
        customInstructions,
        lastUpdated: new Date().toISOString(),
      };
      
      localStorage.setItem(`ai-brain-customization-${user.id}`, JSON.stringify(data));
      
      // محاولة الحفظ في قاعدة البيانات
      try {
        await databaseSync.saveCustomData('brain-customization', data);
      } catch (dbError) {
        console.warn('Failed to save to database, saved locally only', dbError);
      }
      
      setHasChanges(false);
      toast.success('تم حفظ التخصيصات بنجاح');
    } catch (error: any) {
      toast.error('فشل حفظ التخصيصات: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل تريد إعادة تعيين جميع التخصيصات إلى الإعدادات الافتراضية؟')) {
      setSelectedPersonality('متوازن');
      setCustomBehavior({
        aggressiveness: 50,
        creativity: 50,
        cautiousness: 50,
        learningSpeed: 50,
        errorTolerance: 50,
        retryStrategy: 'exponential',
        decisionMaking: 'balanced',
        adaptationStyle: 'moderate',
      });
      setAdvancedSettings({
        maxMemoryUsage: 100,
        maxConcurrentTasks: 5,
        taskPriority: 'balanced',
        dataRetentionDays: 90,
        knowledgeUpdateFrequency: 'daily',
        selfImprovementEnabled: true,
        patternRecognitionSensitivity: 70,
        anomalyDetectionThreshold: 80,
      });
      setCustomInstructions('');
      setHasChanges(true);
      toast.success('تم إعادة تعيين التخصيصات');
    }
  };

  const applyPersonality = (personality: AIPersonality) => {
    setSelectedPersonality(personality.name);
    setCustomBehavior({
      ...customBehavior,
      ...personality.settings,
    });
    setHasChanges(true);
  };

  const updateBehavior = <K extends keyof CustomBehavior>(key: K, value: CustomBehavior[K]) => {
    setCustomBehavior({ ...customBehavior, [key]: value });
    setHasChanges(true);
  };

  const updateAdvanced = <K extends keyof typeof advancedSettings>(
    key: K,
    value: typeof advancedSettings[K]
  ) => {
    setAdvancedSettings({ ...advancedSettings, [key]: value });
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert className="max-w-md">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            يجب تسجيل الدخول لتخصيص عقل AI
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            تخصيص عقل الروبوت
          </h2>
          <p className="text-muted-foreground">
            تحكم كامل في شخصية وسلوك نظام الذكاء الاصطناعي
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التخصيصات'}
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            لديك تغييرات غير محفوظة. تذكر حفظ التخصيصات قبل المغادرة.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personality" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personality">
            <Brain className="w-4 h-4 mr-2" />
            الشخصية
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <Activity className="w-4 h-4 mr-2" />
            السلوك
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Gauge className="w-4 h-4 mr-2" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings2 className="w-4 h-4 mr-2" />
            متقدم
          </TabsTrigger>
          <TabsTrigger value="instructions">
            <Code className="w-4 h-4 mr-2" />
            تعليمات
          </TabsTrigger>
        </TabsList>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اختر شخصية الروبوت</CardTitle>
              <CardDescription>
                شخصيات محددة مسبقاً لأنماط استخدام مختلفة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PERSONALITIES.map((personality) => (
                  <Card
                    key={personality.name}
                    className={`cursor-pointer transition-all ${
                      selectedPersonality === personality.name
                        ? 'border-primary border-2 bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => applyPersonality(personality)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {personality.name}
                        {selectedPersonality === personality.name && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {personality.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">القوة</span>
                          <Badge variant="outline">{personality.settings.aggressiveness}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الإبداع</span>
                          <Badge variant="outline">{personality.settings.creativity}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الحذر</span>
                          <Badge variant="outline">{personality.settings.cautiousness}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">التعلم</span>
                          <Badge variant="outline">{personality.settings.learningSpeed}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تخصيص السلوك</CardTitle>
              <CardDescription>
                ضبط دقيق لكيفية تعامل الروبوت مع المهام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aggressiveness */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    القوة (Aggressiveness)
                  </Label>
                  <Badge variant="outline">{customBehavior.aggressiveness}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  مدى قوة الروبوت في التعامل مع العقبات
                </p>
                <Slider
                  value={[customBehavior.aggressiveness]}
                  onValueChange={([value]) => updateBehavior('aggressiveness', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>حذر جداً</span>
                  <span>قوي جداً</span>
                </div>
              </div>

              {/* Creativity */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    الإبداع (Creativity)
                  </Label>
                  <Badge variant="outline">{customBehavior.creativity}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  مدى ابتكار الروبوت لحلول جديدة
                </p>
                <Slider
                  value={[customBehavior.creativity]}
                  onValueChange={([value]) => updateBehavior('creativity', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>طرق مجربة</span>
                  <span>مبتكر</span>
                </div>
              </div>

              {/* Cautiousness */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    الحذر (Cautiousness)
                  </Label>
                  <Badge variant="outline">{customBehavior.cautiousness}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  مستوى التحقق والحذر قبل اتخاذ الإجراءات
                </p>
                <Slider
                  value={[customBehavior.cautiousness]}
                  onValueChange={([value]) => updateBehavior('cautiousness', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>متهور</span>
                  <span>حذر جداً</span>
                </div>
              </div>

              {/* Learning Speed */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    سرعة التعلم
                  </Label>
                  <Badge variant="outline">{customBehavior.learningSpeed}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  مدى سرعة تعلم الروبوت من التجارب
                </p>
                <Slider
                  value={[customBehavior.learningSpeed]}
                  onValueChange={([value]) => updateBehavior('learningSpeed', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>بطيء</span>
                  <span>سريع جداً</span>
                </div>
              </div>

              {/* Error Tolerance */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>تحمل الأخطاء</Label>
                  <Badge variant="outline">{customBehavior.errorTolerance}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  مدى تحمل الروبوت للأخطاء قبل التوقف
                </p>
                <Slider
                  value={[customBehavior.errorTolerance]}
                  onValueChange={([value]) => updateBehavior('errorTolerance', value)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {/* Strategy Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>استراتيجية إعادة المحاولة</Label>
                  <Select
                    value={customBehavior.retryStrategy}
                    onValueChange={(value: any) => updateBehavior('retryStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">فوري</SelectItem>
                      <SelectItem value="exponential">تصاعدي</SelectItem>
                      <SelectItem value="linear">خطي</SelectItem>
                      <SelectItem value="adaptive">تكيفي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>أسلوب اتخاذ القرار</Label>
                  <Select
                    value={customBehavior.decisionMaking}
                    onValueChange={(value: any) => updateBehavior('decisionMaking', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">سريع</SelectItem>
                      <SelectItem value="balanced">متوازن</SelectItem>
                      <SelectItem value="thorough">شامل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نمط التكيف</Label>
                  <Select
                    value={customBehavior.adaptationStyle}
                    onValueChange={(value: any) => updateBehavior('adaptationStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggressive">قوي</SelectItem>
                      <SelectItem value="moderate">متوسط</SelectItem>
                      <SelectItem value="conservative">محافظ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأداء</CardTitle>
              <CardDescription>
                تحسين استخدام الموارد والأداء العام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>الحد الأقصى للذاكرة (MB)</Label>
                  <Input
                    type="number"
                    value={advancedSettings.maxMemoryUsage}
                    onChange={(e) => updateAdvanced('maxMemoryUsage', parseInt(e.target.value))}
                    min={50}
                    max={1000}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    الحد الأقصى لاستخدام الذاكرة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>المهام المتزامنة</Label>
                  <Input
                    type="number"
                    value={advancedSettings.maxConcurrentTasks}
                    onChange={(e) => updateAdvanced('maxConcurrentTasks', parseInt(e.target.value))}
                    min={1}
                    max={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    عدد المهام التي يمكن تشغيلها في نفس الوقت
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>أولوية المهام</Label>
                  <Select
                    value={advancedSettings.taskPriority}
                    onValueChange={(value) => updateAdvanced('taskPriority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speed">السرعة</SelectItem>
                      <SelectItem value="balanced">متوازن</SelectItem>
                      <SelectItem value="accuracy">الدقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>مدة الاحتفاظ بالبيانات (أيام)</Label>
                  <Input
                    type="number"
                    value={advancedSettings.dataRetentionDays}
                    onChange={(e) => updateAdvanced('dataRetentionDays', parseInt(e.target.value))}
                    min={7}
                    max={365}
                    step={7}
                  />
                </div>

                <div className="space-y-2">
                  <Label>تكرار تحديث المعرفة</Label>
                  <Select
                    value={advancedSettings.knowledgeUpdateFrequency}
                    onValueChange={(value) => updateAdvanced('knowledgeUpdateFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">فوري</SelectItem>
                      <SelectItem value="hourly">كل ساعة</SelectItem>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>التحسين الذاتي التلقائي</Label>
                    <p className="text-sm text-muted-foreground">
                      السماح للنظام بتحسين نفسه تلقائياً
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.selfImprovementEnabled}
                    onCheckedChange={(checked) => updateAdvanced('selfImprovementEnabled', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>حساسية التعرف على الأنماط</Label>
                    <Badge variant="outline">{advancedSettings.patternRecognitionSensitivity}%</Badge>
                  </div>
                  <Slider
                    value={[advancedSettings.patternRecognitionSensitivity]}
                    onValueChange={([value]) => updateAdvanced('patternRecognitionSensitivity', value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>حد كشف الشذوذ</Label>
                    <Badge variant="outline">{advancedSettings.anomalyDetectionThreshold}%</Badge>
                  </div>
                  <Slider
                    value={[advancedSettings.anomalyDetectionThreshold]}
                    onValueChange={([value]) => updateAdvanced('anomalyDetectionThreshold', value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات المتقدمة</CardTitle>
              <CardDescription>
                إعدادات للمستخدمين المتقدمين فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  تغيير هذه الإعدادات قد يؤثر على أداء النظام. استخدمها بحذر.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="mb-2">معلومات النظام</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>• الشخصية: {selectedPersonality}</p>
                    <p>• استراتيجية إعادة المحاولة: {customBehavior.retryStrategy}</p>
                    <p>• أسلوب القرار: {customBehavior.decisionMaking}</p>
                    <p>• نمط التكيف: {customBehavior.adaptationStyle}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="mb-2 text-blue-900">نصائح التحسين</h4>
                  <ul className="space-y-1 text-blue-700 text-xs">
                    <li>• للمهام السريعة: اختر شخصية "سريع" مع قوة 70%+</li>
                    <li>• للمهام الحساسة: اختر شخصية "دقيق" مع حذر 80%+</li>
                    <li>• لحل المشاكل المعقدة: زد الإبداع إلى 80%+</li>
                    <li>• للاستقرار: استخدم استراتيجية "تصاعدي" لإعادة المحاولة</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Instructions Tab */}
        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تعليمات مخصصة</CardTitle>
              <CardDescription>
                أضف تعليمات خاصة توجه سلوك الروبوت
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>تعليمات مخصصة للروبوت</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="مثال:&#10;- دائماً انتظر 3 ثواني بعد كل نقرة&#10;- تجنب المواقع التي تحتوي على كلمة 'captcha'&#10;- استخدم وضع التخفي دائماً&#10;- احفظ جميع الأخطاء في ملف منفصل"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  اكتب تعليمات واضحة ومحددة. سيحاول الروبوت اتباع هذه التعليمات في جميع المهام.
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  التعليمات المخصصة ستُطبق على جميع المهام. تأكد من كتابتها بوضوح.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm mb-2">أمثلة على التعليمات المفيدة:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• "انتظر تحميل الصفحة بالكامل قبل التفاعل"</li>
                  <li>• "احفظ نسخة احتياطية من جميع البيانات المجموعة"</li>
                  <li>• "أرسل إشعار عند فشل أي مهمة"</li>
                  <li>• "استخدم proxy عند الوصول لمواقع محددة"</li>
                  <li>• "تجاهل الأخطاء الصغيرة واستمر في المهمة"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            ملخص التخصيص الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="text-muted-foreground mb-1">الشخصية</p>
              <p className="font-medium">{selectedPersonality}</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="text-muted-foreground mb-1">القوة</p>
              <p className="font-medium">{customBehavior.aggressiveness}%</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="text-muted-foreground mb-1">الإبداع</p>
              <p className="font-medium">{customBehavior.creativity}%</p>
            </div>
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="text-muted-foreground mb-1">الحذر</p>
              <p className="font-medium">{customBehavior.cautiousness}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
