import { ExecutionLog } from '../App';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Download, PlayCircle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

type ExecutionLogsProps = {
  logs: ExecutionLog[];
};

export function ExecutionLogs({ logs: propLogs }: ExecutionLogsProps) {
  const { logs: contextLogs } = useApp();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  // استخدام logs من context كمصدر أساسي
  const allLogs = propLogs.length > 0 ? propLogs : contextLogs;

  const filteredLogs = allLogs.filter(log => 
    filterStatus === 'all' || log.status === filterStatus
  );

  // إضافة معلومات إضافية للوضوح
  useEffect(() => {
    console.log('📊 Execution Logs Updated:', {
      totalLogs: allLogs.length,
      filteredLogs: filteredLogs.length,
      filterStatus
    });
  }, [allLogs, filteredLogs, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl">سجل التنفيذ</h2>
              <p className="text-sm text-slate-500 mt-1">
                مجموع السجلات: {allLogs.length} | معروض: {filteredLogs.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">جميع الحالات ({allLogs.length})</option>
                <option value="success">ناجحة فقط ({allLogs.filter(l => l.status === 'success').length})</option>
                <option value="failed">فاشلة فقط ({allLogs.filter(l => l.status === 'failed').length})</option>
              </select>
              <button 
                onClick={() => {
                  const dataStr = JSON.stringify(allLogs, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `execution-logs-${Date.now()}.json`;
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>تصدير السجل</span>
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">{filteredLogs.map((log) => (
            <div key={log.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
                    )}
                    <h3 className="text-lg">{log.taskName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.status === 'success' ? 'bg-green-50 text-green-700' :
                      log.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}>
                      {log.status === 'success' ? 'نجح' :
                       log.status === 'failed' ? 'فشل' : 'قيد التنفيذ'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-500 mb-3">
                    <span>بدأ: {log.startTime.toLocaleString('ar-SA')}</span>
                    {log.endTime && (
                      <span>انتهى: {log.endTime.toLocaleString('ar-SA')}</span>
                    )}
                    {log.duration && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        المدة: {log.duration} ثانية
                      </span>
                    )}
                  </div>

                  {expandedLog === log.id && (
                    <div className="mt-4 space-y-4">
                      {/* Logs */}
                      {log.logs && log.logs.length > 0 && (
                        <div>
                          <h4 className="text-sm mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            سجل التنفيذ ({log.logs.length} سطر):
                          </h4>
                          <div className="bg-slate-50 rounded-lg p-4 space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
                            {log.logs.map((logLine, index) => (
                              <div key={index} className="text-slate-700">
                                <span className="text-slate-400">[{index + 1}]</span> {logLine}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data */}
                      {log.data && (
                        <div>
                          <h4 className="text-sm mb-2">البيانات المُستخرجة:</h4>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <pre className="text-sm text-slate-700 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Screenshot */}
                      {log.screenshot && (
                        <div>
                          <h4 className="text-sm mb-2">لقطة الشاشة:</h4>
                          <img
                            src={log.screenshot}
                            alt="Screenshot"
                            className="rounded-lg border border-slate-200 max-w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {expandedLog === log.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">
                {allLogs.length === 0 
                  ? 'لا توجد سجلات تنفيذ بعد'
                  : 'لا توجد سجلات تنفيذ متطابقة مع الفلتر'
                }
              </p>
              <p className="text-sm text-slate-400">
                {allLogs.length === 0 
                  ? 'قم بتنفيذ مهمة لرؤية سجلات التنفيذ هنا'
                  : 'جرب تغيير الفلتر لعرض سجلات أخرى'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}