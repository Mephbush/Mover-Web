import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Film, Code, Archive, Folder, Loader, AlertCircle, Link } from 'lucide-react';
import JSZip from 'jszip';

interface FilePreviewModalProps {
  url?: string;
  blob?: Blob;
  fileName?: string;
  file?: { url?: string; blob?: Blob; fileName?: string };
  onClose: () => void;
  onRetry?: () => void; // إضافة callback للمحاولة مرة أخرى
}

type FileType = 'image' | 'video' | 'text' | 'code' | 'json' | 'zip' | 'unknown';

interface ZipFile {
  name: string;
  path: string;
  content: string | ArrayBuffer;
  type: FileType;
}

export function FilePreviewModal({ url, blob, fileName, file, onClose, onRetry }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileType>('unknown');
  const [content, setContent] = useState<any>(null);
  const [zipFiles, setZipFiles] = useState<ZipFile[]>([]);
  const [selectedZipFile, setSelectedZipFile] = useState<ZipFile | null>(null);
  const [isZipExpanded, setIsZipExpanded] = useState(false);

  // إعطاء الأولوية للـ props المباشرة، ثم استخدام file object
  const actualUrl = url || file?.url;
  const actualBlob = blob || file?.blob;
  const actualFileName = fileName || file?.fileName;

  useEffect(() => {
    loadFile();
  }, [actualUrl, actualBlob]);

  const detectFileType = (name: string, content?: ArrayBuffer): FileType => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }
    
    // Videos
    if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
      return 'video';
    }
    
    // Code files
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'css', 'scss', 'html', 'xml', 'yml', 'yaml', 'sh', 'md'].includes(ext)) {
      return 'code';
    }
    
    // JSON
    if (ext === 'json') {
      return 'json';
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'zip';
    }
    
    // Text files
    if (['txt', 'log', 'csv', 'tsv'].includes(ext)) {
      return 'text';
    }
    
    return 'unknown';
  };

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);

      let fileBlob: Blob | null = null;
      let name = actualFileName || 'file';
      let directUrlAvailable = false;

      if (actualBlob) {
        fileBlob = actualBlob;
      } else if (actualUrl) {
        // تنظيف وتطبيع الرابط
        let cleanUrl = actualUrl.trim();
        
        // معالجة الروابط بدون بروتوكول (//example.com)
        if (cleanUrl.startsWith('//')) {
          cleanUrl = 'https:' + cleanUrl;
        }
        
        // معالجة الروابط النسبية
        if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('blob:') && !cleanUrl.startsWith('data:')) {
          // إذا كان رابط نسبي، استخدم window.location.origin
          if (cleanUrl.startsWith('/')) {
            cleanUrl = window.location.origin + cleanUrl;
          } else if (cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
            cleanUrl = new URL(cleanUrl, window.location.href).href;
          } else {
            // افترض أنه رابط نسبي من المجلد الحالي
            cleanUrl = window.location.origin + '/' + cleanUrl;
          }
        }
        
        // إذا كان رابط blob محلي، استخدمه مباشرة
        if (cleanUrl.startsWith('blob:')) {
          try {
            const response = await fetch(cleanUrl);
            if (!response.ok) throw new Error('Failed to load blob');
            fileBlob = await response.blob();
          } catch (error) {
            throw new Error('فشل تحميل الملف المحلي');
          }
        }
        // إذا كان data URL، حوّله لـ Blob
        else if (cleanUrl.startsWith('data:')) {
          try {
            const response = await fetch(cleanUrl);
            fileBlob = await response.blob();
          } catch (error) {
            throw new Error('فشل معالجة Data URL');
          }
        }
        // إذا كان رابط GitHub raw، حمّله مباشرة
        else if (cleanUrl.includes('raw.githubusercontent.com') || cleanUrl.includes('github.com') && cleanUrl.includes('/raw/')) {
          try {
            const response = await fetch(cleanUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache',
              headers: {
                'Accept': '*/*'
              }
            });
            
            if (!response.ok) {
              throw new Error(`GitHub: ${response.status}`);
            }
            
            fileBlob = await response.blob();
          } catch (error) {
            // إذا فشل التحميل من GitHub، نسمح بعرض بديل
            directUrlAvailable = true;
            fileBlob = null;
          }
        }
        // إذا كان رابط GitHub API
        else if (cleanUrl.includes('api.github.com')) {
          try {
            // محاولة استخراج المحتوى من API
            const response = await fetch(cleanUrl, {
              headers: {
                'Accept': 'application/vnd.github.v3.raw'
              }
            });
            
            if (!response.ok) {
              throw new Error(`GitHub API: ${response.status}`);
            }
            
            fileBlob = await response.blob();
          } catch (error) {
            // إذا فشل API، حاول تحويله لرابط raw
            try {
              const rawUrl = cleanUrl
                .replace('api.github.com/repos/', 'raw.githubusercontent.com/')
                .replace('/contents/', '/main/')
                .replace('/master/', '/main/');
              
              const response = await fetch(rawUrl, {
                mode: 'cors',
                credentials: 'omit'
              });
              
              if (!response.ok) throw new Error('Failed to load from raw URL');
              fileBlob = await response.blob();
            } catch (fallbackError) {
              directUrlAvailable = true;
              fileBlob = null;
            }
          }
        }
        // روابط عادية HTTP/HTTPS
        else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          let fetchSucceeded = false;
          
          // محاولة 1: CORS مع credentials omit
          try {
            const response = await fetch(cleanUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache',
              headers: {
                'Accept': '*/*'
              }
            });
            
            if (response.ok) {
              fileBlob = await response.blob();
              fetchSucceeded = true;
            }
          } catch (error1) {
            console.log('CORS attempt failed:', error1);
          }
          
          // محاولة 2: بدون CORS mode (للروابط من نفس الـ origin)
          if (!fetchSucceeded) {
            try {
              const response = await fetch(cleanUrl, {
                cache: 'no-cache'
              });
              
              if (response.ok) {
                fileBlob = await response.blob();
                fetchSucceeded = true;
              }
            } catch (error2) {
              console.log('Same-origin attempt failed:', error2);
            }
          }
          
          // محاولة 3: استخدام CORS proxy
          if (!fetchSucceeded) {
            try {
              const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
              const response = await fetch(proxyUrl, {
                cache: 'no-cache'
              });
              
              if (response.ok) {
                fileBlob = await response.blob();
                fetchSucceeded = true;
              }
            } catch (error3) {
              console.log('Proxy attempt failed:', error3);
            }
          }
          
          // إذا فشلت جميع المحاولات، نسمح بعرض بديل
          if (!fetchSucceeded) {
            directUrlAvailable = true;
            fileBlob = null;
          }
        }
        // رابط غير معروف - نسمح بعرض بديل
        else {
          directUrlAvailable = true;
          fileBlob = null;
        }
        
        // محاولة استخراج اسم الملف من URL
        try {
          const urlParts = cleanUrl.split('/');
          const urlFileName = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
          if (urlFileName && urlFileName.includes('.')) {
            name = decodeURIComponent(urlFileName);
          }
        } catch (e) {
          // تجاهل خطأ استخراج الاسم
        }
        
        // إذا لم نحصل على اسم ملف، حاول استنتاج الامتداد من نوع المحتوى
        if ((!name || !name.includes('.')) && fileBlob && fileBlob.type) {
          const extension = getExtensionFromMimeType(fileBlob.type);
          if (extension) {
            name = name ? `${name}.${extension}` : `file.${extension}`;
          }
        }
      } else {
        throw new Error('لم يتم توفير URL أو Blob');
      }

      // إذا فشل التحميل لكن لدينا URL مباشر، نعرض خيارات بديلة
      if (!fileBlob && directUrlAvailable && actualUrl) {
        const type = detectFileType(name);
        setFileType(type);
        
        // نعرض واجهة بديلة حسب نوع الملف
        setContent({
          directUrl: true,
          url: actualUrl,
          fileName: name,
          type: type
        });
        
        setLoading(false);
        return;
      }
      
      // إذا لم يكن لدينا fileBlob على الإطلاق
      if (!fileBlob) {
        throw new Error('فشل تحميل الملف من جميع المصادر');
      }

      const type = detectFileType(name);
      setFileType(type);

      // معالجة حسب نوع الملف
      if (type === 'zip') {
        await handleZipFile(fileBlob, name);
      } else if (type === 'image') {
        const objectUrl = URL.createObjectURL(fileBlob);
        setContent(objectUrl);
      } else if (type === 'video') {
        const objectUrl = URL.createObjectURL(fileBlob);
        setContent(objectUrl);
      } else if (type === 'text' || type === 'code') {
        const text = await fileBlob.text();
        setContent(text);
      } else if (type === 'json') {
        const text = await fileBlob.text();
        try {
          const json = JSON.parse(text);
          setContent(JSON.stringify(json, null, 2));
        } catch {
          setContent(text);
        }
      } else {
        // للملفات غير المعروفة، نعرض معلومات أساسية
        setContent({
          size: fileBlob.size,
          type: fileBlob.type,
          name: name,
          blob: fileBlob,
          url: actualUrl
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading file:', err);
      
      // رسالة خطأ أكثر وضوحاً
      let errorMessage = 'حدث خطأ أثناء تحميل الملف';
      
      if (err.message === 'CORS_BLOCKED') {
        errorMessage = 'لا يمكن تحميل الملف بسبب قيود CORS';
      } else if (err.message === 'UNSUPPORTED_URL_TYPE') {
        errorMessage = `نوع الرابط غير مدعوم: ${actualUrl}`;
      } else if (err.message.includes('CORS')) {
        errorMessage = 'لا يمكن تحميل الملف بسبب قيود CORS';
      } else if (err.message.includes('GitHub')) {
        errorMessage = 'فشل تحميل الملف من GitHub. تحقق من الصلاحيات.';
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // إذا كان لدينا URL، نعرض خيار فتحه مباشرة
      if (actualUrl) {
        const name = actualFileName || 'file';
        const type = detectFileType(name);
        
        setContent({
          error: true,
          url: actualUrl,
          message: errorMessage,
          fileName: name,
          type: type
        });
      }
      
      setLoading(false);
    }
  };

  // دالة مساعدة للحصول على الامتداد من نوع MIME
  const getExtensionFromMimeType = (mimeType: string): string | null => {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/json': 'json',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/zip': 'zip'
    };
    
    return mimeMap[mimeType.split(';')[0]] || null;
  };

  const handleZipFile = async (zipBlob: Blob, zipName: string) => {
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(zipBlob);
      
      const files: ZipFile[] = [];
      
      for (const [path, zipEntry] of Object.entries(zipData.files)) {
        if (!zipEntry.dir) {
          const fileType = detectFileType(path);
          let content: string | ArrayBuffer;
          
          // قراءة المحتوى حسب النوع
          if (fileType === 'image' || fileType === 'video') {
            content = await zipEntry.async('arraybuffer');
          } else {
            content = await zipEntry.async('text');
          }
          
          files.push({
            name: path.split('/').pop() || path,
            path: path,
            content: content,
            type: fileType
          });
        }
      }
      
      setZipFiles(files);
      setIsZipExpanded(true);
      
      // اختر أول ملف تلقائياً
      if (files.length > 0) {
        setSelectedZipFile(files[0]);
      }
    } catch (err: any) {
      throw new Error('فشل فك ضغط الملف: ' + err.message);
    }
  };

  const renderZipFilePreview = (file: ZipFile) => {
    if (file.type === 'image' && file.content instanceof ArrayBuffer) {
      const blob = new Blob([file.content]);
      const url = URL.createObjectURL(blob);
      return (
        <div className="flex items-center justify-center h-full bg-slate-100">
          <img src={url} alt={file.name} className="max-w-full max-h-full object-contain" />
        </div>
      );
    } else if (file.type === 'video' && file.content instanceof ArrayBuffer) {
      const blob = new Blob([file.content]);
      const url = URL.createObjectURL(blob);
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <video src={url} controls className="max-w-full max-h-full" />
        </div>
      );
    } else if (typeof file.content === 'string') {
      return (
        <div className="h-full overflow-auto bg-slate-50 p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap">{file.content}</pre>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
          <p>لا يمكن معاينة هذا النوع من الملفات</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 mx-auto mb-3 animate-spin text-blue-600" />
            <p className="text-slate-600">جاري تحميل الملف...</p>
          </div>
        </div>
      );
    }

    // إذا كان لدينا URL مباشر ولم نتطع تحميل الملف (CORS)
    if (content?.directUrl && content?.url) {
      const isImage = content.type === 'image';
      const isVideo = content.type === 'video';
      
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-2xl mx-auto p-6">
            {/* محاولة عرض مباشر للصور والفيديو */}
            {isImage && (
              <div className="mb-6 p-4 bg-slate-100 rounded-lg">
                <img 
                  src={content.url} 
                  alt={content.fileName}
                  className="max-w-full max-h-64 mx-auto object-contain rounded"
                  onError={(e) => {
                    // إذا فشل تحميل الصورة، نخفي العنصر
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {isVideo && (
              <div className="mb-6 p-4 bg-black rounded-lg">
                <video 
                  src={content.url} 
                  controls
                  className="max-w-full max-h-64 mx-auto rounded"
                  onError={(e) => {
                    // إذا فشل تحميل الفيديو، نخفي العنصر
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 mb-4">
              {isImage && <ImageIcon className="w-8 h-8 text-blue-600" />}
              {isVideo && <Film className="w-8 h-8 text-purple-600" />}
              {!isImage && !isVideo && <FileText className="w-8 h-8 text-slate-600" />}
              <h3 className="text-lg font-semibold">{content.fileName}</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              {isImage && "الصورة متوفرة للعرض المباشر. استخدم الخيارات أدناه للوصول إليها."}
              {isVideo && "الفيديو متوفر للعرض المباشر. استخدم الخيارات أدناه للوصول إليه."}
              {!isImage && !isVideo && "الملف غير متاح للمعاينة المباشرة بسبب قيود CORS. استخدم الخيارات أدناه للوصول إليه."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => window.open(content.url, '_blank')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>فتح في نافذة جديدة</span>
              </button>
              
              <a
                href={content.url}
                download={content.fileName}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>تحميل الملف</span>
              </a>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(content.url);
                  alert('تم نسخ الرابط!');
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors sm:col-span-2"
              >
                <FileText className="w-5 h-5" />
                <span>نسخ الرابط</span>
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
              <p className="text-xs text-blue-800 mb-2">
                <strong>💡 لماذا لا يمكن المعاينة المباشرة؟</strong>
              </p>
              <p className="text-xs text-blue-700">
                بعض الخوادم تمنع المعاينة المباشرة للملفات بسبب سياسات CORS. 
                يمكنك فتح الملف في نافذة جديدة أو تحميله مباشرة.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // إذا كان هناك خطأ لكن لدينا URL، نعرض خيارات بديلة
    if (error && content?.error && content?.url) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">فشل تحميل الملف</h3>
            <p className="text-sm text-slate-600 mb-6">{content.message}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.open(content.url, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>فتح الرابط في نافذة جديدة</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(content.url);
                  alert('تم نسخ الرابط!');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>نسخ الرابط</span>
              </button>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-right">
                <p className="text-xs text-blue-800">
                  <strong>نصيحة:</strong> إذا كان الملف من GitHub، تأكد من أن المستودع عام أو لديك صلاحيات الوصول.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // خطأ بدون URL
    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold mb-2">فشل تحميل الملف</p>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      );
    }

    if (fileType === 'zip') {
      return (
        <div className="flex h-96">
          {/* قائمة الملفات */}
          <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span className="text-sm font-medium">الملفات ({zipFiles.length})</span>
            </div>
            {zipFiles.map((file, index) => (
              <button
                key={index}
                onClick={() => setSelectedZipFile(file)}
                className={`w-full text-right p-3 hover:bg-slate-100 transition-colors border-b border-slate-100 ${
                  selectedZipFile?.path === file.path ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {file.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-600" />}
                  {file.type === 'code' && <Code className="w-4 h-4 text-green-600" />}
                  {file.type === 'text' && <FileText className="w-4 h-4 text-slate-600" />}
                  {file.type === 'json' && <FileText className="w-4 h-4 text-orange-600" />}
                  {file.type === 'video' && <Film className="w-4 h-4 text-purple-600" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 truncate">{file.path}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* معاينة الملف المختار */}
          <div className="flex-1">
            {selectedZipFile ? (
              <>
                <div className="p-3 bg-slate-100 border-b border-slate-200">
                  <p className="text-sm font-medium">{selectedZipFile.name}</p>
                  <p className="text-xs text-slate-500">{selectedZipFile.path}</p>
                </div>
                {renderZipFilePreview(selectedZipFile)}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Folder className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>اختر ملفاً للمعاينة</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (fileType === 'image') {
      return (
        <div className="flex items-center justify-center h-96 bg-slate-100">
          <img src={content} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="flex items-center justify-center h-96 bg-black">
          <video src={content} controls className="max-w-full max-h-full" />
        </div>
      );
    }

    if (fileType === 'text' || fileType === 'code' || fileType === 'json') {
      return (
        <div className="h-96 overflow-auto bg-slate-50 p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>
        </div>
      );
    }

    if (fileType === 'unknown' && content) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="font-medium mb-2">{content.name}</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p>الحجم: {(content.size / 1024).toFixed(2)} KB</p>
              <p>النوع: {content.type || 'غير معروف'}</p>
            </div>
            <button
              onClick={() => {
                if (actualUrl) {
                  window.open(actualUrl, '_blank');
                }
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الملف</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {fileType === 'image' && <ImageIcon className="w-5 h-5 text-blue-600" />}
              {fileType === 'video' && <Film className="w-5 h-5 text-blue-600" />}
              {fileType === 'code' && <Code className="w-5 h-5 text-blue-600" />}
              {fileType === 'zip' && <Archive className="w-5 h-5 text-blue-600" />}
              {fileType === 'text' && <FileText className="w-5 h-5 text-blue-600" />}
              {fileType === 'json' && <FileText className="w-5 h-5 text-blue-600" />}
              {fileType === 'unknown' && <FileText className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="font-semibold">معاينة الملف</h2>
              <p className="text-sm text-slate-600">{actualFileName || 'ملف'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {actualUrl && (
              <button
                onClick={() => window.open(actualUrl, '_blank')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="فتح في نافذة جديدة"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span className="px-2 py-1 bg-white rounded border border-slate-200">
                {fileType === 'zip' ? `ZIP - ${zipFiles.length} ملف` : fileType.toUpperCase()}
              </span>
              {actualUrl && (
                <a
                  href={actualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  فتح الرابط الأصلي
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* زر محاولة أخرى - يظهر عند وجود خطأ أو CORS */}
              {(error || content?.directUrl || content?.error) && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Link className="w-4 h-4" />
                  <span>محاولة أخرى</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}