import { useState } from 'react';
import { Link, Eye, Loader } from 'lucide-react';
import { FilePreviewModal } from './FilePreviewModal';

export function FilePreviewWithUrl() {
  const [url, setUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const handlePreview = () => {
    if (!url.trim()) {
      alert('الرجاء إدخال رابط');
      return;
    }
    setCurrentUrl(url);
    setShowPreview(true);
  };

  const handleNewUrl = () => {
    setShowPreview(false);
    setUrl('');
    setCurrentUrl('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">معاينة ملف من رابط</h3>
            <p className="text-sm text-slate-600">أدخل رابط الملف الذي تريد معاينته</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">رابط الملف</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePreview();
                }
              }}
              placeholder="https://example.com/file.pdf"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={!url.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة الملف</span>
            </button>

            {currentUrl && (
              <button
                onClick={handleNewUrl}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                رابط جديد
              </button>
            )}
          </div>
        </div>

        {/* أمثلة */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">أمثلة:</p>
          <div className="space-y-1">
            {[
              'https://example.com/document.pdf',
              'https://raw.githubusercontent.com/user/repo/main/image.png',
              '/path/to/local/file.txt',
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setUrl(example)}
                className="block w-full text-right text-xs text-blue-600 hover:underline p-1"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal للمعاينة */}
      {showPreview && currentUrl && (
        <FilePreviewModal
          url={currentUrl}
          onClose={() => {
            // لا نغلق الـ preview تماماً، فقط نخفي الـ modal
            setShowPreview(false);
          }}
        />
      )}

      {/* زر معاينة جديدة بعد المعاينة الأولى */}
      {currentUrl && !showPreview && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">تمت المعاينة بنجاح!</p>
              <p className="text-xs text-green-700 mt-1">الملف: {currentUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                إعادة المعاينة
              </button>
              <button
                onClick={handleNewUrl}
                className="px-3 py-1.5 bg-white text-green-900 text-sm border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                رابط جديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
