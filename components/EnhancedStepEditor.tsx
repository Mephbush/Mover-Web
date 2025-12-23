import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import {
  Settings,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  Code,
  Clock,
  Zap,
} from 'lucide-react';

type StepConfig = {
  id: string;
  type: string;
  params: any;
  fallbacks: any[];
  conditions: any[];
  errorHandling: {
    ignoreErrors: boolean;
    retryCount: number;
    retryDelay?: number;
    captureErrorScreenshot?: boolean;
  };
  validation?: {
    enabled: boolean;
    rules: any[];
  };
  output?: {
    captureScreenshot?: boolean;
    captureVideo?: boolean;
    videoQuality?: 'low' | 'medium' | 'high';
    videoDuration?: number;
    extractData?: boolean;
    dataSelectors?: string[];
  };
};

type EnhancedStepEditorProps = {
  step: StepConfig;
  onUpdate: (step: StepConfig) => void;
  onDelete?: () => void;
};

export function EnhancedStepEditor({ step, onUpdate, onDelete }: EnhancedStepEditorProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const updateParams = (key: string, value: any) => {
    onUpdate({
      ...step,
      params: { ...step.params, [key]: value },
    });
  };

  const updateErrorHandling = (key: string, value: any) => {
    onUpdate({
      ...step,
      errorHandling: { ...step.errorHandling, [key]: value },
    });
  };

  const updateOutput = (key: string, value: any) => {
    onUpdate({
      ...step,
      output: { ...step.output, [key]: value },
    });
  };

  const addFallback = () => {
    const newFallback = { ...step.params };
    onUpdate({
      ...step,
      fallbacks: [...step.fallbacks, newFallback],
    });
  };

  const updateFallback = (index: number, key: string, value: any) => {
    const newFallbacks = [...step.fallbacks];
    newFallbacks[index] = { ...newFallbacks[index], [key]: value };
    onUpdate({
      ...step,
      fallbacks: newFallbacks,
    });
  };

  const removeFallback = (index: number) => {
    onUpdate({
      ...step,
      fallbacks: step.fallbacks.filter((_, i) => i !== index),
    });
  };

  const addCondition = () => {
    const newCondition = {
      type: 'selector-exists',
      selector: '',
      action: 'skip',
    };
    onUpdate({
      ...step,
      conditions: [...step.conditions, newCondition],
    });
  };

  const removeCondition = (index: number) => {
    onUpdate({
      ...step,
      conditions: step.conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className=\"border-2\">
      <CardHeader>
        <div className=\"flex justify-between items-start\">
          <div>
            <CardTitle className=\"flex items-center gap-2\">
              <Settings className=\"w-5 h-5\" />
              إعدادات الخطوة: {step.type}
            </CardTitle>
            <CardDescription>
              تخصيص شامل لسلوك الخطوة والتعامل مع الأخطاء
            </CardDescription>
          </div>
          {onDelete && (
            <Button variant=\"destructive\" size=\"sm\" onClick={onDelete}>
              <Trash2 className=\"w-4 h-4\" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className=\"grid w-full grid-cols-5\">
            <TabsTrigger value=\"basic\">أساسي</TabsTrigger>
            <TabsTrigger value=\"fallback\">بدائل ({step.fallbacks.length})</TabsTrigger>
            <TabsTrigger value=\"errors\">معالجة الأخطاء</TabsTrigger>
            <TabsTrigger value=\"output\">المخرجات</TabsTrigger>
            <TabsTrigger value=\"conditions\">شروط ({step.conditions.length})</TabsTrigger>
          </TabsList>

          {/* Basic Settings */}
          <TabsContent value=\"basic\" className=\"space-y-4\">
            {/* Type-specific parameters */}
            {step.type === 'navigate' && (
              <div className=\"space-y-2\">
                <Label>رابط URL</Label>
                <Input
                  type=\"url\"
                  value={step.params.url || ''}
                  onChange={(e) => updateParams('url', e.target.value)}
                  placeholder=\"https://example.com\"
                />
              </div>
            )}

            {(step.type === 'click' || step.type === 'type') && (
              <div className=\"space-y-2\">
                <Label>المُحدد (Selector)</Label>
                <Input
                  value={step.params.selector || ''}
                  onChange={(e) => updateParams('selector', e.target.value)}
                  placeholder=\"#element, .class, [data-id]\"
                />
                <p className=\"text-xs text-muted-foreground\">
                  استخدم CSS selector أو XPath
                </p>
              </div>
            )}

            {step.type === 'type' && (
              <div className=\"space-y-2\">
                <Label>النص المُدخل</Label>
                <Input
                  value={step.params.text || ''}
                  onChange={(e) => updateParams('text', e.target.value)}
                  placeholder=\"النص الذي سيتم كتابته\"
                />
              </div>
            )}

            {step.type === 'wait' && (
              <>
                <div className=\"space-y-2\">
                  <Label>نوع الانتظار</Label>
                  <Select
                    value={step.params.type || 'time'}
                    onValueChange={(value) => updateParams('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"time\">وقت محدد</SelectItem>
                      <SelectItem value=\"selector\">ظهور عنصر</SelectItem>
                      <SelectItem value=\"navigation\">تحميل الصفحة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {step.params.type === 'time' && (
                  <div className=\"space-y-2\">
                    <Label>المدة (بالثواني)</Label>
                    <Input
                      type=\"number\"
                      value={step.params.duration || 1}
                      onChange={(e) => updateParams('duration', parseInt(e.target.value))}
                      min=\"0\"
                      max=\"60\"
                    />
                  </div>
                )}

                {step.params.type === 'selector' && (
                  <div className=\"space-y-2\">
                    <Label>المُحدد</Label>
                    <Input
                      value={step.params.selector || ''}
                      onChange={(e) => updateParams('selector', e.target.value)}
                      placeholder=\".element\"
                    />
                  </div>
                )}
              </>
            )}

            {step.type === 'video' && (
              <>
                <div className=\"space-y-2\">
                  <Label>جودة الفيديو</Label>
                  <Select
                    value={step.params.quality || 'medium'}
                    onValueChange={(value) => updateParams('quality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"low\">منخفضة (أسرع)</SelectItem>
                      <SelectItem value=\"medium\">متوسطة</SelectItem>
                      <SelectItem value=\"high\">عالية (أبطأ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className=\"space-y-2\">
                  <Label>المدة (بالثواني)</Label>
                  <div className=\"flex items-center gap-4\">
                    <Slider
                      value={[step.params.duration || 10]}
                      onValueChange={([value]) => updateParams('duration', value)}
                      min={1}
                      max={60}
                      step={1}
                      className=\"flex-1\"
                    />
                    <span className=\"text-sm w-12 text-right\">{step.params.duration || 10}s</span>
                  </div>
                </div>

                <div className=\"space-y-2\">
                  <Label>معدل الإطارات (FPS)</Label>
                  <Select
                    value={String(step.params.fps || 30)}
                    onValueChange={(value) => updateParams('fps', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"15\">15 FPS</SelectItem>
                      <SelectItem value=\"30\">30 FPS</SelectItem>
                      <SelectItem value=\"60\">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className=\"flex items-center justify-between\">
                  <Label>تضمين الصوت</Label>
                  <Switch
                    checked={step.params.includeAudio || false}
                    onCheckedChange={(checked) => updateParams('includeAudio', checked)}
                  />
                </div>
              </>
            )}

            {step.type === 'screenshot' && (
              <div className=\"flex items-center justify-between\">
                <Label>صورة للصفحة كاملة</Label>
                <Switch
                  checked={step.params.fullPage || false}
                  onCheckedChange={(checked) => updateParams('fullPage', checked)}
                />
              </div>
            )}

            {step.type === 'extract' && (
              <>
                <div className=\"space-y-2\">
                  <Label>المُحدد الرئيسي</Label>
                  <Input
                    value={step.params.selector || ''}
                    onChange={(e) => updateParams('selector', e.target.value)}
                    placeholder=\".item, article\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label>نوع الاستخراج</Label>
                  <Select
                    value={step.params.extractType || 'text'}
                    onValueChange={(value) => updateParams('extractType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"text\">نص</SelectItem>
                      <SelectItem value=\"html\">HTML</SelectItem>
                      <SelectItem value=\"attribute\">خاصية محددة</SelectItem>
                      <SelectItem value=\"all\">الكل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {step.params.extractType === 'attribute' && (
                  <div className=\"space-y-2\">
                    <Label>اسم الخاصية</Label>
                    <Input
                      value={step.params.attribute || ''}
                      onChange={(e) => updateParams('attribute', e.target.value)}
                      placeholder=\"href, src, data-id\"
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Fallback Settings */}
          <TabsContent value=\"fallback\" className=\"space-y-4\">
            <div className=\"flex justify-between items-center\">
              <p className=\"text-sm text-muted-foreground\">
                إضافة بدائل لاستخدامها عند فشل الخطوة الأساسية
              </p>
              <Button onClick={addFallback} size=\"sm\">
                <Plus className=\"w-4 h-4 mr-2\" />
                إضافة بديل
              </Button>
            </div>

            {step.fallbacks.length === 0 ? (
              <div className=\"text-center py-8 text-muted-foreground\">
                <AlertTriangle className=\"w-12 h-12 mx-auto mb-4 opacity-50\" />
                <p>لا توجد بدائل</p>
                <p className=\"text-sm\">أضف بدائل لزيادة موثوقية الخطوة</p>
              </div>
            ) : (
              <div className=\"space-y-3\">
                {step.fallbacks.map((fallback, index) => (
                  <Card key={index}>
                    <CardHeader className=\"pb-3\">
                      <div className=\"flex justify-between items-center\">
                        <Badge variant=\"outline\">البديل {index + 1}</Badge>
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => removeFallback(index)}
                        >
                          <Trash2 className=\"w-4 h-4 text-red-500\" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className=\"space-y-2\">
                      {step.type === 'click' || step.type === 'type' ? (
                        <div>
                          <Label className=\"text-xs\">Selector</Label>
                          <Input
                            value={fallback.selector || ''}
                            onChange={(e) =>
                              updateFallback(index, 'selector', e.target.value)
                            }
                            placeholder=\"Fallback selector\"
                            size=\"sm\"
                          />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Error Handling */}
          <TabsContent value=\"errors\" className=\"space-y-4\">
            <div className=\"space-y-4\">
              <div className=\"flex items-center justify-between p-4 border rounded-lg\">
                <div>
                  <Label>تجاهل الأخطاء</Label>
                  <p className=\"text-xs text-muted-foreground\">
                    الاستمرار حتى عند فشل الخطوة
                  </p>
                </div>
                <Switch
                  checked={step.errorHandling.ignoreErrors}
                  onCheckedChange={(checked) =>
                    updateErrorHandling('ignoreErrors', checked)
                  }
                />
              </div>

              <div className=\"space-y-2\">
                <Label>عدد محاولات إعادة التنفيذ</Label>
                <div className=\"flex items-center gap-4\">
                  <Slider
                    value={[step.errorHandling.retryCount]}
                    onValueChange={([value]) => updateErrorHandling('retryCount', value)}
                    min={0}
                    max={10}
                    step={1}
                    className=\"flex-1\"
                  />
                  <span className=\"text-sm w-8 text-right\">
                    {step.errorHandling.retryCount}
                  </span>
                </div>
              </div>

              <div className=\"space-y-2\">
                <Label>التأخير بين المحاولات (بالثواني)</Label>
                <Input
                  type=\"number\"
                  value={step.errorHandling.retryDelay || 1}
                  onChange={(e) =>
                    updateErrorHandling('retryDelay', parseInt(e.target.value))
                  }
                  min=\"0\"
                  max=\"10\"
                />
              </div>

              <div className=\"flex items-center justify-between p-4 border rounded-lg\">
                <div>
                  <Label>التقاط صورة عند الخطأ</Label>
                  <p className=\"text-xs text-muted-foreground\">
                    لتسهيل تحليل الأخطاء
                  </p>
                </div>
                <Switch
                  checked={step.errorHandling.captureErrorScreenshot || false}
                  onCheckedChange={(checked) =>
                    updateErrorHandling('captureErrorScreenshot', checked)
                  }
                />
              </div>

              <div className=\"p-4 bg-yellow-50 border border-yellow-200 rounded-lg\">
                <div className=\"flex items-start gap-2\">
                  <AlertTriangle className=\"w-5 h-5 text-yellow-600 mt-0.5\" />
                  <div>
                    <p className=\"text-sm\">نصائح معالجة الأخطاء</p>
                    <ul className=\"text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside\">
                      <li>استخدم البدائل للتعامل مع selectors مختلفة</li>
                      <li>زد عدد المحاولات للخطوات الحساسة</li>
                      <li>فعّل التقاط الصور لتسهيل التشخيص</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Output Settings */}
          <TabsContent value=\"output\" className=\"space-y-4\">
            <div className=\"space-y-4\">
              <div className=\"flex items-center justify-between p-4 border rounded-lg\">
                <div className=\"flex items-center gap-2\">
                  <ImageIcon className=\"w-5 h-5\" />
                  <div>
                    <Label>التقاط صورة بعد التنفيذ</Label>
                    <p className=\"text-xs text-muted-foreground\">
                      حفظ لقطة شاشة للتحقق
                    </p>
                  </div>
                </div>
                <Switch
                  checked={step.output?.captureScreenshot || false}
                  onCheckedChange={(checked) =>
                    updateOutput('captureScreenshot', checked)
                  }
                />
              </div>

              <div className=\"flex items-center justify-between p-4 border rounded-lg\">
                <div className=\"flex items-center gap-2\">
                  <Video className=\"w-5 h-5\" />
                  <div>
                    <Label>تسجيل فيديو للخطوة</Label>
                    <p className=\"text-xs text-muted-foreground\">
                      تسجيل تنفيذ الخطوة كاملة
                    </p>
                  </div>
                </div>
                <Switch
                  checked={step.output?.captureVideo || false}
                  onCheckedChange={(checked) => updateOutput('captureVideo', checked)}
                />
              </div>

              {step.output?.captureVideo && (
                <div className=\"ml-8 space-y-3 p-3 bg-muted rounded-lg\">
                  <div className=\"space-y-2\">
                    <Label className=\"text-xs\">جودة الفيديو</Label>
                    <Select
                      value={step.output.videoQuality || 'medium'}
                      onValueChange={(value) => updateOutput('videoQuality', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"low\">منخفضة</SelectItem>
                        <SelectItem value=\"medium\">متوسطة</SelectItem>
                        <SelectItem value=\"high\">عالية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className=\"space-y-2\">
                    <Label className=\"text-xs\">المدة القصوى (ثواني)</Label>
                    <Input
                      type=\"number\"
                      value={step.output.videoDuration || 30}
                      onChange={(e) =>
                        updateOutput('videoDuration', parseInt(e.target.value))
                      }
                      min=\"5\"
                      max=\"120\"
                    />
                  </div>
                </div>
              )}

              <div className=\"flex items-center justify-between p-4 border rounded-lg\">
                <div className=\"flex items-center gap-2\">
                  <Code className=\"w-5 h-5\" />
                  <div>
                    <Label>استخراج بيانات إضافية</Label>
                    <p className=\"text-xs text-muted-foreground\">
                      جمع بيانات من الصفحة تلقائياً
                    </p>
                  </div>
                </div>
                <Switch
                  checked={step.output?.extractData || false}
                  onCheckedChange={(checked) => updateOutput('extractData', checked)}
                />
              </div>

              <div className=\"p-4 bg-blue-50 border border-blue-200 rounded-lg\">
                <div className=\"flex items-start gap-2\">
                  <CheckCircle2 className=\"w-5 h-5 text-blue-600 mt-0.5\" />
                  <div>
                    <p className=\"text-sm\">فوائد التقاط المخرجات</p>
                    <ul className=\"text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside\">
                      <li>سهولة التحقق من نجاح المهمة</li>
                      <li>أرشفة كاملة لكل تنفيذ</li>
                      <li>تحليل متقدم للأداء</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Conditions */}
          <TabsContent value=\"conditions\" className=\"space-y-4\">
            <div className=\"flex justify-between items-center\">
              <p className=\"text-sm text-muted-foreground\">
                إضافة شروط لتنفيذ الخطوة أو تخطيها
              </p>
              <Button onClick={addCondition} size=\"sm\">
                <Plus className=\"w-4 h-4 mr-2\" />
                إضافة شرط
              </Button>
            </div>

            {step.conditions.length === 0 ? (
              <div className=\"text-center py-8 text-muted-foreground\">
                <Zap className=\"w-12 h-12 mx-auto mb-4 opacity-50\" />
                <p>لا توجد شروط</p>
                <p className=\"text-sm\">أضف شروط لجعل التنفيذ أكثر ذكاءً</p>
              </div>
            ) : (
              <div className=\"space-y-3\">
                {step.conditions.map((condition, index) => (
                  <Card key={index}>
                    <CardHeader className=\"pb-3\">
                      <div className=\"flex justify-between items-center\">
                        <Badge variant=\"outline\">الشرط {index + 1}</Badge>
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => removeCondition(index)}
                        >
                          <Trash2 className=\"w-4 h-4 text-red-500\" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className=\"text-sm text-muted-foreground\">
                      الشروط قيد التطوير
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
