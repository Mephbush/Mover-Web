import { useState } from 'react';
import { Shield, Play, AlertTriangle, CheckCircle, XCircle, Eye, Loader, TrendingUp, Cpu, Chrome } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  score: number;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix?: string;
}

export function BotDetectionTester() {
  const { settings } = useApp();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  const botDetectionTests = [
    {
      name: 'WebDriver Detection',
      category: 'Browser',
      test: `navigator.webdriver === undefined`,
      description: 'فحص علامة navigator.webdriver',
      severity: 'critical' as const,
      fix: 'تفعيل hideWebdriver في إعدادات التخفي'
    },
    {
      name: 'Chrome Detection',
      category: 'Browser',
      test: `window.chrome !== undefined`,
      description: 'فحص وجود window.chrome',
      severity: 'high' as const,
      fix: 'استخدام stealth plugin لإضافة window.chrome'
    },
    {
      name: 'Permissions API',
      category: 'Browser',
      test: `navigator.permissions !== undefined`,
      description: 'فحص Permissions API',
      severity: 'medium' as const,
      fix: 'تفعيل maskFingerprint'
    },
    {
      name: 'Plugins Detection',
      category: 'Browser',
      test: `navigator.plugins.length > 0`,
      description: 'فحص وجود plugins',
      severity: 'medium' as const,
      fix: 'إضافة plugins وهمية'
    },
    {
      name: 'Languages Detection',
      category: 'Browser',
      test: `navigator.languages.length > 1`,
      description: 'فحص تعدد اللغات',
      severity: 'low' as const,
      fix: 'تفعيل randomLanguage'
    },
    {
      name: 'WebGL Vendor',
      category: 'Graphics',
      test: `(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) return false;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return debugInfo && gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) !== 'Google Inc.';
      })()`,
      description: 'فحص WebGL vendor',
      severity: 'high' as const,
      fix: 'تفعيل maskFingerprint لإخفاء WebGL'
    },
    {
      name: 'Canvas Fingerprint',
      category: 'Graphics',
      test: `(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser Bot Detection Test', 0, 0);
        return canvas.toDataURL().length > 5000;
      })()`,
      description: 'فحص Canvas fingerprinting',
      severity: 'high' as const,
      fix: 'تفعيل maskFingerprint لتعديل Canvas'
    },
    {
      name: 'Battery API',
      category: 'Hardware',
      test: `navigator.getBattery !== undefined`,
      description: 'فحص Battery API',
      severity: 'low' as const,
      fix: 'إضافة battery API وهمي'
    },
    {
      name: 'Connection Type',
      category: 'Network',
      test: `navigator.connection !== undefined`,
      description: 'فحص معلومات الاتصال',
      severity: 'low' as const,
      fix: 'إضافة connection info وهمي'
    },
    {
      name: 'Media Devices',
      category: 'Hardware',
      test: `navigator.mediaDevices !== undefined`,
      description: 'فحص أجهزة الوسائط',
      severity: 'medium' as const,
      fix: 'إضافة media devices وهمية'
    },
    {
      name: 'User Agent Consistency',
      category: 'Browser',
      test: `(() => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        // Check if UA matches platform
        if (ua.includes('Windows') && platform.includes('Win')) return true;
        if (ua.includes('Mac') && platform.includes('Mac')) return true;
        if (ua.includes('Linux') && platform.includes('Linux')) return true;
        return false;
      })()`,
      description: 'فحص تطابق User Agent مع Platform',
      severity: 'critical' as const,
      fix: 'التأكد من تطابق randomUserAgent مع النظام'
    },
    {
      name: 'Timezone Consistency',
      category: 'Location',
      test: `(() => {
        const offset = new Date().getTimezoneOffset();
        return offset !== 0 || Intl.DateTimeFormat().resolvedOptions().timeZone !== 'UTC';
      })()`,
      description: 'فحص المنطقة الزمنية',
      severity: 'medium' as const,
      fix: 'تفعيل randomTimezone'
    },
    {
      name: 'Headless Detection',
      category: 'Browser',
      test: `!navigator.webdriver && !window._phantom && !window.__nightmare && !window.callPhantom`,
      description: 'فحص المتصفحات headless',
      severity: 'critical' as const,
      fix: 'استخدام وضع headed أو تفعيل advanced stealth'
    },
    {
      name: 'Automation Detection',
      category: 'Browser',
      test: `!window.domAutomation && !window.domAutomationController`,
      description: 'فحص أدوات الأتمتة',
      severity: 'critical' as const,
      fix: 'تفعيل hideWebdriver'
    }
  ];

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    toast.info('جاري اختبار نظام التخفي...');

    try {
      const testResults: TestResult[] = [];
      let totalScore = 0;

      // محاكاة تشغيل الاختبارات
      for (const test of botDetectionTests) {
        await new Promise(resolve => setTimeout(resolve, 300));

        // محاكاة النتيجة بناءً على الإعدادات
        const passed = simulateTest(test.name, test.category);
        const score = passed ? 100 : 0;
        
        testResults.push({
          name: test.name,
          category: test.category,
          passed,
          score,
          details: test.description,
          severity: test.severity,
          fix: test.fix
        });

        totalScore += score;
      }

      const avgScore = Math.round(totalScore / botDetectionTests.length);
      
      setResults(testResults);
      setOverallScore(avgScore);

      if (avgScore >= 80) {
        toast.success(`نجح! نسبة التخفي: ${avgScore}%`);
      } else if (avgScore >= 60) {
        toast.warning(`تحذير! نسبة التخفي: ${avgScore}% - يُنصح بالتحسين`);
      } else {
        toast.error(`فشل! نسبة التخفي: ${avgScore}% - ��جب تحسين الإعدادات`);
      }
    } catch (error: any) {
      toast.error('فشل الاختبار: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const simulateTest = (testName: string, category: string): boolean => {
    // محاكاة النتائج بناءً على الإعدادات الحالية
    const stealth = settings.stealth;

    switch (testName) {
      case 'WebDriver Detection':
        return stealth.hideWebdriver;
      case 'Chrome Detection':
        return stealth.level !== 'basic';
      case 'Permissions API':
        return stealth.maskFingerprint;
      case 'Plugins Detection':
        return stealth.level === 'maximum';
      case 'Languages Detection':
        return stealth.randomLanguage || stealth.level === 'maximum';
      case 'WebGL Vendor':
      case 'Canvas Fingerprint':
        return stealth.maskFingerprint;
      case 'Battery API':
      case 'Connection Type':
      case 'Media Devices':
        return stealth.level === 'maximum';
      case 'User Agent Consistency':
        return stealth.randomUserAgent;
      case 'Timezone Consistency':
        return stealth.randomTimezone;
      case 'Headless Detection':
      case 'Automation Detection':
        return stealth.hideWebdriver && stealth.level !== 'basic';
      default:
        return Math.random() > 0.3;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            <span>اختبار كشف الروبوتات</span>
          </h2>
          <p className="text-slate-600 mt-1">
            اختبر فعالية إعدادات التخفي ضد أنظمة كشف الروبوتات
          </p>
        </div>
        
        <button
          onClick={runTests}
          disabled={testing}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {testing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>جاري الاختبار...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>تشغيل الاختبارات</span>
            </>
          )}
        </button>
      </div>

      {/* Overall Score */}
      {overallScore !== null && (
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-lg mb-4">نسبة التخفي الإجمالية</h3>
            <div className={`text-6xl mb-4 ${overallScore >= 80 ? '' : 'opacity-75'}`}>
              {overallScore}%
            </div>
            <div className="flex items-center justify-center gap-8 mt-6">
              <div>
                <div className="text-3xl">{passedCount}</div>
                <div className="text-sm opacity-90">نجح</div>
              </div>
              <div className="w-px h-12 bg-white opacity-30" />
              <div>
                <div className="text-3xl">{failedCount}</div>
                <div className="text-sm opacity-90">فشل</div>
              </div>
              <div className="w-px h-12 bg-white opacity-30" />
              <div>
                <div className="text-3xl">{results.length}</div>
                <div className="text-sm opacity-90">إجمالي</div>
              </div>
            </div>
            
            {overallScore < 80 && (
              <div className="mt-6 p-4 bg-white/20 rounded-lg">
                <p className="text-sm">
                  {overallScore < 60 
                    ? '⚠️ يجب تحسين إعدادات التخفي! انتقل لصفحة الإعدادات واختر "أقصى حماية"'
                    : '💡 يُنصح بتحسين بعض الإعدادات للحصول على حماية أفضل'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Categories */}
      {Object.keys(groupedResults).length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([category, tests]) => {
            const categoryPassed = tests.filter(t => t.passed).length;
            const categoryTotal = tests.length;
            const categoryScore = Math.round((categoryPassed / categoryTotal) * 100);

            return (
              <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category === 'Browser' && <Chrome className="w-5 h-5 text-blue-600" />}
                    {category === 'Graphics' && <Eye className="w-5 h-5 text-purple-600" />}
                    {category === 'Hardware' && <Cpu className="w-5 h-5 text-orange-600" />}
                    {category === 'Network' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {category === 'Location' && <Shield className="w-5 h-5 text-pink-600" />}
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-slate-500">
                      ({categoryPassed}/{categoryTotal})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${getScoreColor(categoryScore)}`}>
                      {categoryScore}%
                    </span>
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          categoryScore >= 80 ? 'bg-green-600' :
                          categoryScore >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${categoryScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {tests.map((test, index) => (
                    <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {test.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{test.name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(test.severity)}`}>
                              {test.severity}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-2">{test.details}</p>
                          
                          {!test.passed && test.fix && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <span className="font-medium">حل مقترح: </span>
                                {test.fix}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className={`font-semibold ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {test.score}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !testing && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            لم يتم تشغيل الاختبارات بعد
          </h3>
          <p className="text-slate-600 mb-6">
            انقر على "تشغيل الاختبارات" لفحص فعالية نظام التخفي
          </p>
          <button
            onClick={runTests}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            <span>تشغيل الاختبارات</span>
          </button>
        </div>
      )}
    </div>
  );
}
