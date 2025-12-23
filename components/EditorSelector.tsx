import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  FileCode,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

type EditorMode = 'code' | 'visual' | 'advanced' | 'smart';

interface EditorSelectorProps {
  currentMode: EditorMode;
  onSelect: (mode: EditorMode) => void;
  taskSource?: string;
}

const EDITOR_INFO = {
  code: {
    title: 'محرر الكود المتقدم',
    icon: FileCode,
    color: 'slate',
    description: 'تحكم كامل في الكود - للمبرمجين',
    features: [
      'كتابة كود JavaScript/Puppeteer مباشرة',
      'تحكم كامل في كل التفاصيل',
      'مثالي للمهام المعقدة',
      'يتطلب معرفة برمجية',
    ],
    difficulty: 'متقدم',
  },
  visual: {
    title: 'المنشئ المرئي البسيط',
    icon: Eye,
    color: 'blue',
    description: 'واجهة مرئية سهلة - للمبتدئين',
    features: [
      'بناء المهام بالسحب والإفلات',
      'لا يتطلب معرفة برمجية',
      'واجهة بسيطة وسهلة',
      'مثالي للمهام البسيطة',
    ],
    difficulty: 'مبتدئ',
  },
  advanced: {
    title: 'المنشئ المرئي المتقدم',
    icon: Layers,
    color: 'purple',
    description: 'واجهة مرئية متقدمة - للمحترفين',
    features: [
      'إمكانيات متقدمة مع واجهة مرئية',
      'شروط وحلقات ومنطق معقد',
      'معاينة مباشرة للنتائج',
      'توازن بين السهولة والقوة',
    ],
    difficulty: 'متوسط',
  },
  smart: {
    title: 'المنشئ الذكي بالـ AI',
    icon: Sparkles,
    color: 'green',
    description: 'ذكاء اصطناعي يساعدك - للجميع',
    features: [
      'يفهم وصفك ويبني المهمة تلقائياً',
      'اقتراحات ذكية أثناء البناء',
      'تصحيح تلقائي للأخطاء',
      'مثالي لجميع المستويات',
    ],
    difficulty: 'سهل',
  },
};

export function EditorSelector({ currentMode, onSelect, taskSource }: EditorSelectorProps) {
  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string; activeBorder: string; activeBg: string }> = {
      slate: {
        border: 'border-slate-300',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        activeBorder: 'border-slate-500',
        activeBg: 'bg-slate-100',
      },
      blue: {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        activeBorder: 'border-blue-500',
        activeBg: 'bg-blue-100',
      },
      purple: {
        border: 'border-purple-300',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        activeBorder: 'border-purple-500',
        activeBg: 'bg-purple-100',
      },
      green: {
        border: 'border-green-300',
        bg: 'bg-green-50',
        text: 'text-green-700',
        activeBorder: 'border-green-500',
        activeBg: 'bg-green-100',
      },
    };

    const c = colors[color];
    return {
      border: isSelected ? c.activeBorder : c.border,
      bg: isSelected ? c.activeBg : c.bg,
      text: c.text,
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'مبتدئ':
      case 'سهل':
        return 'bg-green-100 text-green-700';
      case 'متوسط':
        return 'bg-yellow-100 text-yellow-700';
      case 'متقدم':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">اختر محرر المهام</h3>
        <p className="text-sm text-muted-foreground">
          كل محرر له مميزاته - اختر الأنسب لمستواك ونوع المهمة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(EDITOR_INFO) as EditorMode[]).map((mode) => {
          const info = EDITOR_INFO[mode];
          const Icon = info.icon;
          const isSelected = currentMode === mode;
          const colors = getColorClasses(info.color, isSelected);

          return (
            <Card
              key={mode}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? `border-2 ${colors.border} ${colors.bg}`
                  : 'border hover:shadow-lg'
              }`}
              onClick={() => onSelect(mode)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    <CardTitle className="text-base">{info.title}</CardTitle>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  {info.description}
                </CardDescription>
                <Badge className={getDifficultyColor(info.difficulty)} variant="secondary">
                  {info.difficulty}
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {info.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(mode);
                  }}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="w-full mt-3"
                >
                  {isSelected ? 'المحرر الحالي' : 'اختر هذا المحرر'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {taskSource && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-900">
              💡 <strong>ملاحظة:</strong> هذه المهمة تم إنشاؤها من{' '}
              <strong>{getSourceLabel(taskSource)}</strong>. يمكنك تعديلها بأي محرر تريد.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">نصائح لاختيار المحرر المناسب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-blue-600">•</span>
            <p>
              <strong>المبتدئين:</strong> ابدأ بالمنشئ المرئي البسيط أو الذكي بالـ AI
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-purple-600">•</span>
            <p>
              <strong>المحترفين:</strong> استخدم المنشئ المتقدم للمهام المعقدة
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-slate-600">•</span>
            <p>
              <strong>المبرمجين:</strong> محرر الكود يعطيك تحكم كامل
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-green-600">•</span>
            <p>
              <strong>للجميع:</strong> المنشئ الذكي يساعدك أياً كان مستواك
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'visual-builder': 'المنشئ المرئي',
    'advanced-builder': 'المنشئ المرئي المتقدم',
    'smart-builder': 'المنشئ الذكي',
    'task-editor': 'محرر المهام',
    'template': 'قالب جاهز',
    'github-import': 'مستورد من GitHub',
  };
  return labels[source] || source;
}
