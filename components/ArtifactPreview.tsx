import { X, Download, FileText, Image as ImageIcon, FileJson, File, Folder, Archive, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import JSZip from 'jszip';

interface ArtifactPreviewProps {
  artifact: {
    id: number;
    name: string;
    size_in_bytes: number;
  };
  onClose: () => void;
  onDownload: () => Promise<Blob>;
}

interface ZipFile {
  name: string;
  path: string;
  size: number;
  blob: Blob;
  isDirectory: boolean;
}

export function ArtifactPreview({ artifact, onClose, onDownload }: ArtifactPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [zipFiles, setZipFiles] = useState<ZipFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ZipFile | null>(null);
  const [preview, setPreview] = useState<{
    type: 'image' | 'json' | 'text' | 'unknown';
    content: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(100);

  useEffect(() => {
    loadZipContents();
  }, [artifact.id]);

  useEffect(() => {
    if (selectedFile && !selectedFile.isDirectory) {
      setImageZoom(100); // إعادة تعيين التكبير عند تغيير الملف
      loadFilePreview(selectedFile);
    }
  }, [selectedFile]);

  const loadZipContents = async () => {
    setLoading(true);
    setError(null);
    try {
      // تحميل الملف المضغوط
      console.log('⬇️ بدء تحميل artifact...');
      const blob = await onDownload();
      
      console.log(`✓ تم التحميل: ${blob.size} بايت`);
      
      // فك ضغط الملف
      console.log('📦 فك ضغط الملف...');
      const zip = await JSZip.loadAsync(blob);
      const files: ZipFile[] = [];

      // استخراج جميع الملفات
      const promises: Promise<void>[] = [];
      
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          promises.push(
            zipEntry.async('blob').then((content) => {
              files.push({
                name: relativePath.split('/').pop() || relativePath,
                path: relativePath,
                size: content.size,
                blob: content,
                isDirectory: false
              });
            })
          );
        }
      });

      await Promise.all(promises);
      
      // ترتيب الملفات: الصور أولاً، ثم JSON، ثم الباقي
      files.sort((a, b) => {
        const aIsImage = a.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
        const bIsImage = b.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
        const aIsJson = a.name.endsWith('.json');
        const bIsJson = b.name.endsWith('.json');
        
        if (aIsImage && !bIsImage) return -1;
        if (!aIsImage && bIsImage) return 1;
        if (aIsJson && !bIsJson) return -1;
        if (!aIsJson && bIsJson) return 1;
        
        return a.path.localeCompare(b.path);
      });
      
      setZipFiles(files);
      console.log(`✓ تم استخراج ${files.length} ملف`);
      
      // اختيار أول ملف تلقائياً
      if (files.length > 0) {
        setSelectedFile(files[0]);
      }
    } catch (error: any) {
      console.error('Error loading ZIP:', error);
      
      // رسائل خطأ واضحة
      let errorMessage = 'فشل تحميل الملف المضغوط';
      
      if (error.message?.includes('❌')) {
        // الخطأ من downloadArtifact - استخدمه كما هو
        errorMessage = error.message;
      } else if (error.message?.includes('not a valid zip file')) {
        errorMessage = '❌ الملف ليس ZIP صالح. قد يكون تالفاً.';
      } else if (error.message?.includes('invalid distance')) {
        errorMessage = '❌ الملف تالف أو معطوب.';
      } else if (error.name === 'AbortError') {
        errorMessage = '❌ انتهت مهلة التحميل. الملف قد يكون كبيراً جداً.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = '❌ خطأ في الاتصال بالشبكة. تحقق من الاتصال بالإنترنت.';
      } else {
        errorMessage = `❌ خطأ: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFilePreview = async (file: ZipFile) => {
    setLoading(true);
    setPreview(null);
    
    try {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.gif') || fileName.endsWith('.webp') || fileName.endsWith('.svg')) {
        // صورة - عرضها مباشرة
        const url = URL.createObjectURL(file.blob);
        setPreview({ type: 'image', content: url });
      } else if (fileName.endsWith('.json')) {
        // JSON - عرضه منسّق
        const text = await file.blob.text();
        try {
          const json = JSON.parse(text);
          setPreview({ type: 'json', content: JSON.stringify(json, null, 2) });
        } catch {
          setPreview({ type: 'text', content: text });
        }
      } else if (
        fileName.endsWith('.txt') || 
        fileName.endsWith('.log') || 
        fileName.endsWith('.md') || 
        fileName.endsWith('.csv') ||
        fileName.endsWith('.html') ||
        fileName.endsWith('.css') ||
        fileName.endsWith('.js') ||
        fileName.endsWith('.xml') ||
        fileName.endsWith('.yml') ||
        fileName.endsWith('.yaml')
      ) {
        // نص - عرضه مباشرة
        const text = await file.blob.text();
        setPreview({ type: 'text', content: text });
      } else {
        // نوع غير معروف
        setPreview({ type: 'unknown', content: null });
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreview({ type: 'unknown', content: null });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = (file: ZipFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    try {
      const blob = await onDownload();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.name + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.svg')) {
      return <ImageIcon className="size-4 text-purple-600" />;
    } else if (lower.endsWith('.json')) {
      return <FileJson className="size-4 text-blue-600" />;
    } else if (lower.endsWith('.txt') || lower.endsWith('.log') || lower.endsWith('.md')) {
      return <FileText className="size-4 text-slate-600" />;
    } else {
      return <File className="size-4 text-slate-400" />;
    }
  };

  const getPreviewIcon = () => {
    if (!preview) return <File className="size-5" />;
    
    switch (preview.type) {
      case 'image':
        return <ImageIcon className="size-5" />;
      case 'json':
        return <FileJson className="size-5" />;
      case 'text':
        return <FileText className="size-5" />;
      default:
        return <File className="size-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Archive className="size-5 text-orange-600" />
            <div>
              <h3>{artifact.name}</h3>
              <p className="text-sm text-gray-500">
                {(artifact.size_in_bytes / 1024).toFixed(2)} KB • {zipFiles.length} ملف
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="size-4" />
              تحميل الكل
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && zipFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">جاري فك ضغط الملف...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <File className="size-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Files List - Sidebar */}
            <div className="w-64 border-l overflow-y-auto bg-slate-50">
              <div className="p-3 border-b bg-white sticky top-0">
                <h4 className="text-sm text-slate-600">الملفات ({zipFiles.length})</h4>
              </div>
              <div className="p-2 space-y-1">
                {zipFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-right transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto">
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  {/* File Header */}
                  <div className="p-4 border-b bg-slate-50 sticky top-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPreviewIcon()}
                        <div>
                          <h4 className="font-medium">{selectedFile.name}</h4>
                          <p className="text-sm text-slate-500">{selectedFile.path}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(selectedFile)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Download className="size-4" />
                        تحميل
                      </button>
                    </div>
                  </div>

                  {/* File Preview */}
                  <div className="flex-1 p-4 relative">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      </div>
                    ) : preview?.type === 'image' && preview.content ? (
                      <>
                        <div className="flex items-center justify-center h-full overflow-auto">
                          <img 
                            src={preview.content} 
                            alt={selectedFile.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-transform"
                            style={{ transform: `scale(${imageZoom / 100})` }}
                          />
                        </div>
                        {/* Image Controls */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 flex items-center gap-1 p-1">
                          <button
                            onClick={() => setImageZoom(Math.max(10, imageZoom - 25))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="تصغير"
                          >
                            <ZoomOut className="size-4" />
                          </button>
                          <span className="px-3 text-sm min-w-[60px] text-center">{imageZoom}%</span>
                          <button
                            onClick={() => setImageZoom(Math.min(300, imageZoom + 25))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="تكبير"
                          >
                            <ZoomIn className="size-4" />
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1" />
                          <button
                            onClick={() => setImageZoom(100)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="حجم أصلي"
                          >
                            <Maximize2 className="size-4" />
                          </button>
                        </div>
                      </>
                    ) : preview?.type === 'json' && preview.content ? (
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm h-full">
                        <code className="font-mono">{preview.content}</code>
                      </pre>
                    ) : preview?.type === 'text' && preview.content ? (
                      <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap h-full border">
                        {preview.content}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <File className="size-16 opacity-50" />
                        <p>لا يمكن معاينة هذا النوع من الملفات</p>
                        <button
                          onClick={() => handleDownloadFile(selectedFile)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Download className="size-4" />
                          تحميل الملف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <Folder className="size-16 mx-auto mb-4 opacity-50" />
                    <p>اختر ملفاً من القائمة للمعاينة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}