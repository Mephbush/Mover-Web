import { useState, useEffect } from 'react';
import { FileCode, Save, X, Eye, EyeOff, Upload, Edit2, Check, AlertCircle } from 'lucide-react';

export type DeployFile = {
  path: string;
  content: string;
};

type DeployPreviewProps = {
  files: DeployFile[];
  onConfirm: (editedFiles: DeployFile[]) => void;
  onCancel: () => void;
  isDeploying?: boolean;
};

export function DeployPreview({ files, onConfirm, onCancel, isDeploying }: DeployPreviewProps) {
  const [editedFiles, setEditedFiles] = useState<DeployFile[]>(files);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (editedFiles[selectedFileIndex]) {
      setEditContent(editedFiles[selectedFileIndex].content);
    }
  }, [selectedFileIndex, editedFiles]);

  const handleSaveEdit = () => {
    const newFiles = [...editedFiles];
    newFiles[selectedFileIndex].content = editContent;
    setEditedFiles(newFiles);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(editedFiles[selectedFileIndex].content);
    setIsEditing(false);
  };

  const getFileExtension = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ext || 'txt';
  };

  const getFileIcon = (path: string) => {
    const ext = getFileExtension(path);
    if (ext === 'yml' || ext === 'yaml') return '📋';
    if (ext === 'js' || ext === 'mjs') return '📜';
    if (ext === 'json') return '📊';
    if (ext === 'md') return '📝';
    return '📄';
  };

  const selectedFile = editedFiles[selectedFileIndex];
  const hasChanges = JSON.stringify(files) !== JSON.stringify(editedFiles);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl mb-1">معاينة وتعديل الملفات قبل النشر</h2>
              <p className="text-sm text-slate-600">
                يمكنك مراجعة وتعديل الملفات قبل رفعها إلى GitHub
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={isDeploying}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Files List */}
          <div className="w-80 border-l border-slate-200 overflow-y-auto bg-slate-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm">الملفات ({editedFiles.length})</span>
                {hasChanges && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <AlertCircle className="w-3 h-3" />
                    تم التعديل
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {editedFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedFileIndex(index);
                      }
                    }}
                    className={`w-full text-right p-3 rounded-lg transition-all ${
                      selectedFileIndex === index
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-slate-200 hover:border-blue-300'
                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isEditing}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getFileIcon(file.path)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.path}</p>
                        <p className="text-xs text-slate-500">
                          {(file.content.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {JSON.stringify(files[index]) !== JSON.stringify(file) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor/Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(selectedFile.path)}</span>
                  <div>
                    <p className="text-sm">{selectedFile.path}</p>
                    <p className="text-xs text-slate-500">
                      {selectedFile.content.split('\n').length} أسطر • {(selectedFile.content.length / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    disabled={isEditing}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? 'إخفاء' : 'عرض'}
                  </button>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      تعديل
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Save className="w-4 h-4" />
                        حفظ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area */}
            {showPreview && (
              <div className="flex-1 overflow-hidden">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-none"
                    dir="ltr"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="w-full h-full p-4 overflow-auto font-mono text-sm bg-slate-50" dir="ltr">
                    <code>{selectedFile.content}</code>
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {hasChanges ? (
                <p className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  تم تعديل بعض الملفات - تأكد من المراجعة قبل النشر
                </p>
              ) : (
                <p className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  جميع الملفات جاهزة للنشر
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg hover:bg-white transition-colors"
                disabled={isDeploying}
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
              <button
                onClick={() => onConfirm(editedFiles)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEditing || isDeploying}
              >
                <Upload className="w-4 h-4" />
                {isDeploying ? 'جاري النشر...' : 'تأكيد ونشر'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}