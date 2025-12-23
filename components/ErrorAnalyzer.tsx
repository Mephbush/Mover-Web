import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, TrendingUp, Clock, FileText, Settings, RefreshCw, Zap, Brain, Filter } from 'lucide-react';
import { ErrorLogger, SmartErrorAnalyzer, ErrorContext, ErrorAnalysis } from '../utils/error-handler';
import { errorTracker, ErrorLogger as NewErrorLogger, AppError } from '../utils/error-tracker';
import { useApp } from '../contexts/AppContext';

export function ErrorAnalyzer() {
  const { logs, tasks } = useApp();
  const [errorHistory, setErrorHistory] = useState<AppError[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<AppError | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<{
    category?: any;
    severity?: any;
  }>({});

  useEffect(() => {
    loadData();
    
    // الاشتراك في الأخطاء الجديدة
    const unsubscribe = errorTracker.subscribe((error) => {
      loadData();
    });
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 3000);
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }
    
    return unsubscribe;
  }, [autoRefresh, logs, filter]);

  const loadData = () => {
    // الحصول على الأخطاء المصفاة
    const errors = errorTracker.getErrors(filter);
    setErrorHistory(errors);
    
    // حساب الإحصائيات
    const statistics = errorTracker.getStats();
    setStats(statistics);
  };

  const clearHistory = () => {
    if (confirm('هل أنت متأكد من مسح سجل الأخطاء؟')) {
      ErrorLogger.clearHistory();
      loadData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'selector': return <FileText className="w-4 h-4" />;
      case 'network': return <TrendingUp className="w-4 h-4" />;
      case 'timeout': return <Clock className="w-4 h-4" />;
      case 'authentication': return <Settings className="w-4 h-4" />;
      case 'captcha': return <AlertTriangle className="w-4 h-4" />;
      case 'element_not_interactive': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      selector: 'خطأ محدد العنصر',
      network: 'خطأ شبكة',
      timeout: 'انتهاء الوقت',
      authentication: 'خطأ مصادقة',
      captcha: 'كابتشا',
      element_not_interactive: 'عنصر غير تفاعلي',
      navigation: 'خطأ انتقال',
      unknown: 'خطأ غير معروف'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            <span>محلل الأخطاء الذكي</span>
          </h2>
          <p className="text-slate-600 mt-1">نظام متقدم لفهم ومعالجة الأخطاء تلقائياً</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'تحديث تلقائي' : 'تحديث يدوي'}</span>
          </button>
          
          <button
            onClick={loadData}
            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            مسح السجل
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الأخطاء</p>
                <p className="text-3xl mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">قابلة للإصلاح التلقائي</p>
                <p className="text-3xl mt-2">{stats.autoFixableCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">نسبة النجاح</p>
                <p className="text-3xl mt-2">
                  {stats.total > 0 
                    ? Math.round((stats.autoFixableCount / stats.total) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الأكثر شيوعاً</p>
                <p className="text-lg mt-2">
                  {stats.byType && Object.keys(stats.byType).length > 0 
                    ? getTypeLabel(Object.entries(stats.byType).sort((a: any, b: any) => b[1] - a[1])[0][0])
                    : 'لا يوجد'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">سجل الأخطاء ({errorHistory.length})</h3>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {errorHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>لا توجد أخطاء!</p>
                <p className="text-sm mt-1">النظام يعمل بشكل مثالي</p>
              </div>
            ) : (
              errorHistory.slice().reverse().map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedError(item)}
                  className={`w-full text-right p-4 rounded-lg border transition-all hover:shadow-md ${
                    selectedError === item 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(item.analysis.severity).replace('text-', 'text-').split(' ')[0]}`}>
                      {getTypeIcon(item.analysis.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{getTypeLabel(item.analysis.type)}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(item.analysis.severity)}`}>
                          {item.analysis.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 truncate mb-2">{item.analysis.message}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                        </span>
                        
                        {item.context.task && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.context.task.name}</span>
                          </>
                        )}
                        
                        {item.analysis.autoFixable && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600">
                              <Zap className="w-3 h-3" />
                              قابل للإصلاح
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">التفاصيل والحلول المقترحة</h3>
          
          {selectedError ? (
            <div className="space-y-4">
              {/* Error Info */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(selectedError.analysis.severity).replace('text-', 'text-').split(' ')[0]}`}>
                    {getTypeIcon(selectedError.analysis.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{getTypeLabel(selectedError.analysis.type)}</h4>
                    <p className="text-sm text-slate-600">{selectedError.analysis.message}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">الخطورة:</span>
                    <span className={`mr-2 px-2 py-0.5 rounded-full border ${getSeverityColor(selectedError.analysis.severity)}`}>
                      {selectedError.analysis.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">قابل للإصلاح:</span>
                    <span className="mr-2">
                      {selectedError.analysis.autoFixable ? (
                        <CheckCircle className="w-4 h-4 text-green-600 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 inline" />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Fixes */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  الحلول المقترحة
                </h4>
                <div className="space-y-2">
                  {selectedError.analysis.suggestedFixes.map((fix: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700 flex-1">{fix}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retry Strategy */}
              {selectedError.analysis.retryStrategy && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    استراتيجية إعادة المحاولة
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">عدد المحاولات:</span>
                      <span className="font-medium">{selectedError.analysis.retryStrategy.maxAttempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">التأخير:</span>
                      <span className="font-medium">{selectedError.analysis.retryStrategy.delayMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">مضاعف التأخير:</span>
                      <span className="font-medium">{selectedError.analysis.retryStrategy.backoffMultiplier}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Context */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-600" />
                  معلومات السياق
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedError.context.task && (
                    <div>
                      <span className="text-slate-500">المهمة:</span>
                      <span className="mr-2 font-medium">{selectedError.context.task.name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">الإجراء:</span>
                    <span className="mr-2 font-medium">{selectedError.context.action}</span>
                  </div>
                  {selectedError.context.url && (
                    <div>
                      <span className="text-slate-500">الموقع:</span>
                      <a href={selectedError.context.url} target="_blank" rel="noopener noreferrer" className="mr-2 text-blue-600 hover:underline">
                        {selectedError.context.url}
                      </a>
                    </div>
                  )}
                  {selectedError.context.selector && (
                    <div>
                      <span className="text-slate-500">المحدد:</span>
                      <code className="mr-2 px-2 py-0.5 bg-white rounded border border-slate-200 text-xs">
                        {selectedError.context.selector}
                      </code>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">الوقت:</span>
                    <span className="mr-2">{new Date(selectedError.timestamp).toLocaleString('ar-SA')}</span>
                  </div>
                </div>
              </div>

              {/* Logs */}
              {selectedError.context.logs && selectedError.context.logs.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    السجلات ({selectedError.context.logs.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto bg-slate-900 text-green-400 rounded-lg p-3 font-mono text-xs">
                    {selectedError.context.logs.map((log: string, index: number) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Info className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>اختر خطأ لعرض التفاصيل</p>
              <p className="text-sm mt-1">سيتم عرض الحلول المقترحة والتحليل الكامل</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Details */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold mb-4">تويع حسب النوع</h3>
            <div className="space-y-2">
              {Object.entries(stats.byType).map(([type, count]: any) => (
                <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(type)}
                    <span>{getTypeLabel(type)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{count}</span>
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Severity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold mb-4">توزيع حسب الخطورة</h3>
            <div className="space-y-2">
              {Object.entries(stats.bySeverity).map(([severity, count]: any) => (
                <div key={severity} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className={`px-3 py-1 rounded-full border ${getSeverityColor(severity)}`}>
                    {severity}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{count}</span>
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          severity === 'critical' ? 'bg-red-600' :
                          severity === 'high' ? 'bg-orange-600' :
                          severity === 'medium' ? 'bg-yellow-600' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}