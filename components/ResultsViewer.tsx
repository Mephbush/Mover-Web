import { useState, useEffect } from 'react';
import { Download, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle, Loader, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ArtifactPreview } from './ArtifactPreview';

interface ResultsViewerProps {
  taskId: string;
  taskName: string;
}

export function ResultsViewer({ taskId, taskName }: ResultsViewerProps) {
  const { getTaskResults, downloadArtifact, settings } = useApp();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [previewArtifact, setPreviewArtifact] = useState<any>(null);

  useEffect(() => {
    loadResults();
  }, [taskId]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaskResults(taskId);
      
      // الحصول على artifacts لكل run
      const runsWithArtifacts = await Promise.all(
        data.runs.map(async (run: any) => {
          try {
            const runData = await getTaskResults(taskId, run.id);
            return {
              ...run,
              artifacts: runData.artifacts || []
            };
          } catch (error) {
            // تجاهل الأخطاء بصمت وإرجاع run بدون artifacts
            return {
              ...run,
              artifacts: []
            };
          }
        })
      );
      
      setResults({
        runs: runsWithArtifacts
      });
      
      if (runsWithArtifacts.length > 0) {
        setSelectedRun(runsWithArtifacts[0]);
      }
    } catch (error: any) {
      // لا تعرض خطأ - فقط تسجيل في console للمطورين
      console.log('ℹ️ لا توجد نتائج متاحة بعد');
      
      // لا نعيّن error، بل نترك results فارغة
      setResults({ runs: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadArtifact = async (artifactId: number, artifactName: string) => {
    try {
      console.log('⬇️ بدء تحميل artifact:', artifactId);
      const blob = await downloadArtifact(artifactId);
      
      console.log(`✓ تم التحميل: ${blob.size} بايت`);
      
      // تحميل الملف
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artifactName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ تم تحميل الملف ��نجاح');
    } catch (error: any) {
      console.error('Error downloading artifact:', error);
      
      // عرض رسالة خطأ للمستخدم
      let errorMessage = error.message || 'فشل تحميل الملف';
      
      // التأكد من أن الرسالة واضحة
      if (!errorMessage.includes('❌')) {
        errorMessage = '❌ ' + errorMessage;
      }
      
      alert(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failure':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'failure':
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Loader className="w-5 h-5 animate-spin" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}ث`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}د ${secs}ث`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!results || results.runs.length === 0) {
    // التحقق من حالة الاتصال بـ GitHub
    const isConnectedToGitHub = !!settings.github.owner && !!settings.github.repo && !!settings.github.token;
    
    if (!isConnectedToGitHub) {
      // غير متصل بـ GitHub
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg mb-2">لا توجد نتائج</h3>
          <p className="text-slate-600 mb-6">قم بتشغيل المهمة محلياً أو اربط GitHub لرؤية النتائج</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadResults}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>
      );
    }
    
    // متصل بـ GitHub لكن لا توجد نتائج
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg mb-2">لا توجد نتائج بعد</h3>
        <p className="text-slate-600 mb-4">لم يتم تشغيل هذه المهمة على GitHub Actions بعد</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-right mb-6">
          <p className="text-sm text-blue-900 mb-2">💡 لعرض النتائج:</p>
          <ol className="text-sm text-blue-800 space-y-1 mr-4" style={{ listStyleType: 'decimal' }}>
            <li>انشر المهمة إلى GitHub من صفحة "ربط GitHub"</li>
            <li>شغّل المهمة على GitHub Actions</li>
            <li>انتظر حتى تنتهي</li>
            <li>عد هنا لعرض النتائج</li>
          </ol>
        </div>
        
        <div className="flex gap-3 justify-center">
          <a
            href={`https://github.com/${settings.github.owner}/${settings.github.repo}/actions`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>فتح GitHub Actions</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={loadResults}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl">نتائج المهمة: {taskName}</h3>
          <p className="text-sm text-slate-600">{results.runs.length} تشغيل</p>
        </div>
        <button
          onClick={loadResults}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Runs List */}
        <div className="col-span-1 space-y-3">
          <h4 className="text-sm text-slate-600">التشغيلات السابقة</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.runs.map((run: any) => (
              <button
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className={`w-full p-3 border rounded-lg text-right transition-all ${
                  selectedRun?.id === run.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded ${getStatusColor(run.conclusion || run.status)}`}>
                    {getStatusIcon(run.conclusion || run.status)}
                  </div>
                  <span className="text-sm">#{run.run_number}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(run.created_at)}
                </p>
                {run.conclusion === 'success' && (
                  <p className="text-xs text-green-600 mt-1">
                    {formatDuration(Math.floor((new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000))}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Run Details */}
        {selectedRun && (
          <div className="col-span-2 space-y-4">
            {/* Status Card */}
            <div className={`p-4 border rounded-lg ${getStatusColor(selectedRun.conclusion || selectedRun.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedRun.conclusion || selectedRun.status)}
                  <div>
                    <h4 className="font-medium">التشغيل #{selectedRun.run_number}</h4>
                    <p className="text-sm opacity-75">{formatDate(selectedRun.created_at)}</p>
                  </div>
                </div>
                <a
                  href={selectedRun.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <span>عرض في GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-75 mb-1">الحالة</p>
                  <p className="font-medium">{selectedRun.conclusion || selectedRun.status}</p>
                </div>
                <div>
                  <p className="opacity-75 mb-1">المدة</p>
                  <p className="font-medium">
                    {formatDuration(Math.floor((new Date(selectedRun.updated_at).getTime() - new Date(selectedRun.created_at).getTime()) / 1000))}
                  </p>
                </div>
              </div>
            </div>

            {/* Artifacts */}
            {selectedRun.artifacts && selectedRun.artifacts.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <span>الملفات والنتائج ({selectedRun.artifacts.length})</span>
                </h4>
                <div className="space-y-2">
                  {selectedRun.artifacts.map((artifact: any) => (
                    <div
                      key={artifact.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        {artifact.name.includes('screenshot') || artifact.name.includes('image') ? (
                          <ImageIcon className="w-5 h-5 text-purple-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">{artifact.name}</p>
                          <p className="text-sm text-slate-500">
                            {(artifact.size_in_bytes / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewArtifact(artifact)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>معاينة</span>
                        </button>
                        <button
                          onClick={() => handleDownloadArtifact(artifact.id, artifact.name)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Artifacts */}
            {(!selectedRun.artifacts || selectedRun.artifacts.length === 0) && (
              <div className="border border-slate-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 mb-2">لا توجد ملفات نتائج</p>
                <p className="text-sm text-slate-500">
                  الملفات قد تكون قيد المعالجة أو لم يتم إنشاؤها بعد
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artifact Preview */}
      {previewArtifact && (
        <ArtifactPreview
          artifact={previewArtifact}
          onClose={() => setPreviewArtifact(null)}
          onDownload={() => downloadArtifact(previewArtifact.id)}
        />
      )}
    </div>
  );
}