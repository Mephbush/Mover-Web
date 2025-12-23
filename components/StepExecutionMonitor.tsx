import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Video,
  Code,
  Download,
  Eye,
} from 'lucide-react';

type StepStatus = {
  stepId: string;
  stepNumber: number;
  stepType: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  output?: any;
  screenshot?: string;
  video?: string;
  logs: string[];
  retryCount: number;
  fallbackUsed?: number; // index of fallback used
};

type ExecutionSession = {
  id: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  steps: StepStatus[];
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
};

type StepExecutionMonitorProps = {
  session?: ExecutionSession;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
};

export function StepExecutionMonitor({ session, onPause, onResume, onStop }: StepExecutionMonitorProps) {
  const [selectedStep, setSelectedStep] = useState<StepStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  if (!session) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد جلسة تنفيذ نشطة</p>
            <p className="text-sm">ابدأ تشغيل مهمة لمراقبة تقدمها</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = session.totalSteps > 0 
    ? (session.completedSteps / session.totalSteps) * 100 
    : 0;

  const currentStep = session.steps.find(s => s.status === 'running');

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {session.status === 'running' && <Play className="w-5 h-5 text-green-500 animate-pulse" />}
                {session.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {session.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                {session.status === 'paused' && <Pause className="w-5 h-5 text-yellow-500" />}
                {session.taskName}
              </CardTitle>
              <CardDescription>
                {session.status === 'running' && 'جاري التنفيذ...'}
                {session.status === 'completed' && 'تم التنفيذ بنجاح'}
                {session.status === 'failed' && 'فشل التنفيذ'}
                {session.status === 'paused' && 'متوقف مؤقتاً'}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              {session.status === 'running' && onPause && (
                <Button onClick={onPause} variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  إيقاف مؤقت
                </Button>
              )}
              {session.status === 'paused' && onResume && (
                <Button onClick={onResume} variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  استئناف
                </Button>
              )}
              {onStop && (
                <Button onClick={onStop} variant="destructive" size="sm">
                  إيقاف
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>التقدم: {session.completedSteps} / {session.totalSteps}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
            
            {/* Stats */}
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{session.completedSteps} نجح</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>{session.failedSteps} فشل</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {session.endTime 
                    ? `${Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)}s`
                    : `${Math.round((Date.now() - session.startTime.getTime()) / 1000)}s`
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {currentStep && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="w-4 h-4 animate-pulse" />
              الخطوة الحالية: {currentStep.stepType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">الخطوة {currentStep.stepNumber}</span>
                <Badge variant="default">جاري التنفيذ...</Badge>
              </div>
              {currentStep.retryCount > 0 && (
                <div className="text-sm text-yellow-600">
                  محاولة {currentStep.retryCount}
                </div>
              )}
              {currentStep.fallbackUsed !== undefined && (
                <div className="text-sm text-blue-600">
                  استخدام البديل {currentStep.fallbackUsed + 1}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="errors">
            الأخطاء ({session.failedSteps})
          </TabsTrigger>
          <TabsTrigger value="output">المخرجات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">جميع الخطوات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {session.steps.map((step, index) => (
                    <div
                      key={step.stepId}
                      onClick={() => setSelectedStep(step)}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        selectedStep?.stepId === step.stepId ? 'border-primary bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-mono text-muted-foreground">
                            #{step.stepNumber}
                          </div>
                          <Badge variant="outline">{step.stepType}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {step.status === 'pending' && (
                            <Badge variant="secondary">في الانتظار</Badge>
                          )}
                          {step.status === 'running' && (
                            <Badge variant="default" className="animate-pulse">
                              جاري...
                            </Badge>
                          )}
                          {step.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {step.status === 'failed' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {step.status === 'skipped' && (
                            <Badge variant="outline">تم التخطي</Badge>
                          )}
                        </div>
                      </div>

                      {/* Step Details */}
                      {step.duration && (
                        <div className="text-xs text-muted-foreground">
                          المدة: {step.duration}ms
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          {step.error}
                        </div>
                      )}

                      {step.fallbackUsed !== undefined && (
                        <div className="mt-2 text-xs text-blue-600">
                          ✓ تم استخدام البديل {step.fallbackUsed + 1}
                        </div>
                      )}

                      {/* Media Indicators */}
                      <div className="flex gap-2 mt-2">
                        {step.screenshot && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            صورة
                          </Badge>
                        )}
                        {step.video && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            فيديو
                          </Badge>
                        )}
                        {step.output && (
                          <Badge variant="outline" className="text-xs">
                            <Code className="w-3 h-3 mr-1" />
                            بيانات
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                الخطوات الفاشلة ({session.failedSteps})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {session.steps.filter(s => s.status === 'failed').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p>لا توجد أخطاء</p>
                    </div>
                  ) : (
                    session.steps
                      .filter(s => s.status === 'failed')
                      .map((step) => (
                        <div
                          key={step.stepId}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span>الخطوة {step.stepNumber}: {step.stepType}</span>
                            </div>
                            {step.retryCount > 0 && (
                              <Badge variant="destructive">
                                {step.retryCount} محاولات
                              </Badge>
                            )}
                          </div>
                          
                          {step.error && (
                            <div className="mt-2 p-3 bg-white border border-red-300 rounded text-sm">
                              <p className="font-mono text-red-700">{step.error}</p>
                            </div>
                          )}

                          {/* Error Logs */}
                          {step.logs.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm mb-2">السجلات:</p>
                              <div className="space-y-1">
                                {step.logs.map((log, idx) => (
                                  <div key={idx} className="text-xs font-mono p-2 bg-white rounded">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Screenshot if available */}
                          {step.screenshot && (
                            <div className="mt-3">
                              <Button variant="outline" size="sm" className="w-full">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                عرض لقطة الشاشة عند الخطأ
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">مخرجات الخطوات</CardTitle>
              <CardDescription>
                الصور، الفيديوهات، والبيانات المستخرجة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {/* Screenshots */}
                  {session.steps.some(s => s.screenshot) && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        لقطات الشاشة
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {session.steps
                          .filter(s => s.screenshot)
                          .map((step) => (
                            <div key={step.stepId} className="border rounded-lg p-2">
                              <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                الخطوة {step.stepNumber}: {step.stepType}
                              </div>
                              <Button variant="outline" size="sm" className="w-full mt-2">
                                <Eye className="w-3 h-3 mr-1" />
                                عرض
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {session.steps.some(s => s.video) && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        مقاطع الفيديو
                      </h4>
                      <div className="space-y-3">
                        {session.steps
                          .filter(s => s.video)
                          .map((step) => (
                            <div key={step.stepId} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-sm">الخطوة {step.stepNumber}: {step.stepType}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {step.duration ? `${(step.duration / 1000).toFixed(1)}s` : 'N/A'}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  <Video className="w-3 h-3 mr-1" />
                                  فيديو
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Play className="w-3 h-3 mr-1" />
                                  تشغيل
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Download className="w-3 h-3 mr-1" />
                                  تحميل
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Data */}
                  {session.steps.some(s => s.output) && (
                    <div>
                      <h4 className="mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        البيانات المستخرجة
                      </h4>
                      <div className="space-y-3">
                        {session.steps
                          .filter(s => s.output)
                          .map((step) => (
                            <div key={step.stepId} className="border rounded-lg p-3">
                              <div className="text-sm mb-2">
                                الخطوة {step.stepNumber}: {step.stepType}
                              </div>
                              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                {JSON.stringify(step.output, null, 2)}
                              </pre>
                              <Button variant="outline" size="sm" className="w-full mt-2">
                                <Download className="w-3 h-3 mr-1" />
                                تصدير JSON
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {!session.steps.some(s => s.screenshot || s.video || s.output) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مخرجات بعد</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Step Details */}
      {selectedStep && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm">
              تفاصيل الخطوة {selectedStep.stepNumber}: {selectedStep.stepType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الحالة:</span>
                  <div className="mt-1">
                    {selectedStep.status === 'success' && (
                      <Badge variant="default">نجح</Badge>
                    )}
                    {selectedStep.status === 'failed' && (
                      <Badge variant="destructive">فشل</Badge>
                    )}
                    {selectedStep.status === 'running' && (
                      <Badge variant="default">جاري...</Badge>
                    )}
                    {selectedStep.status === 'pending' && (
                      <Badge variant="secondary">في الانتظار</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">المدة:</span>
                  <div className="mt-1">
                    {selectedStep.duration ? `${selectedStep.duration}ms` : 'N/A'}
                  </div>
                </div>
              </div>

              {selectedStep.logs.length > 0 && (
                <div>
                  <p className="text-sm mb-2">السجلات:</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {selectedStep.logs.map((log, idx) => (
                        <div key={idx} className="text-xs font-mono p-2 bg-muted rounded">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
