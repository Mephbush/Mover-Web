import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Zap, CheckCircle, Info, Save } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { StealthLevel } from '../contexts/AppContext';

export function StealthSettings() {
  const { settings, updateStealthSettings } = useApp();
  const [activeLevel, setActiveLevel] = useState<StealthLevel>(settings.stealth.level);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setActiveLevel(settings.stealth.level);
  }, [settings.stealth.level]);

  const presets = {
    basic: {
      label: 'أساسي',
      description: 'حماية خفيفة للمهام البسيطة',
      config: {
        level: 'basic' as StealthLevel,
        randomUserAgent: true,
        randomViewport: true,
        hideWebdriver: true,
        randomTimezone: false,
        randomLanguage: false,
        humanClicks: false,
        humanTyping: false,
        randomDelays: true,
        mouseMovement: false,
        scrollBehavior: false,
        blockWebRTC: false,
        maskFingerprint: false,
        rotateProxies: false,
        clearCookies: true
      }
    },
    advanced: {
      label: 'متقدم (موصى به)',
      description: 'حماية قوية لمعظم الاستخدامات',
      config: {
        level: 'advanced' as StealthLevel,
        randomUserAgent: true,
        randomViewport: true,
        hideWebdriver: true,
        randomTimezone: true,
        randomLanguage: false,
        humanClicks: true,
        humanTyping: true,
        randomDelays: true,
        mouseMovement: true,
        scrollBehavior: true,
        blockWebRTC: true,
        maskFingerprint: true,
        rotateProxies: false,
        clearCookies: true
      }
    },
    maximum: {
      label: 'أقصى حماية',
      description: 'لأقوى أنظمة الكشف (بطيء)',
      config: {
        level: 'maximum' as StealthLevel,
        randomUserAgent: true,
        randomViewport: true,
        hideWebdriver: true,
        randomTimezone: true,
        randomLanguage: true,
        humanClicks: true,
        humanTyping: true,
        randomDelays: true,
        mouseMovement: true,
        scrollBehavior: true,
        blockWebRTC: true,
        maskFingerprint: true,
        rotateProxies: true,
        clearCookies: true
      }
    }
  };

  const applyPreset = (level: keyof typeof presets) => {
    setActiveLevel(level);
    updateStealthSettings(presets[level].config);
    setHasChanges(false);
  };

  const toggleSetting = (key: string) => {
    updateStealthSettings({ [key]: !settings.stealth[key as keyof typeof settings.stealth] });
    setHasChanges(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">إعدادات التخفي والحماية</h1>
              <p className="text-slate-600">تُطبق تلقائياً على جميع المهام</p>
            </div>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>تم الحفظ تلقائياً</span>
            </div>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => applyPreset(key as keyof typeof presets)}
            className={`p-6 border-2 rounded-xl transition-all text-right ${
              activeLevel === key
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg">{preset.label}</h3>
              {activeLevel === key && (
                <CheckCircle className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <p className="text-sm text-slate-600">{preset.description}</p>
          </button>
        ))}
      </div>

      {/* Settings Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg mb-6">إعدادات مخصصة</h3>
        
        <div className="space-y-6">
          {/* Browser Fingerprint */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-purple-600">
              <Eye className="w-5 h-5" />
              <span>إخفاء بصمة المتصفح</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SettingToggle
                label="User Agent عشوائي"
                description="تغيير هوية المتصفح"
                checked={settings.stealth.randomUserAgent}
                onChange={() => toggleSetting('randomUserAgent')}
              />
              <SettingToggle
                label="حجم نافذة عشوائي"
                description="تغيير أبعاد الشاشة"
                checked={settings.stealth.randomViewport}
                onChange={() => toggleSetting('randomViewport')}
              />
              <SettingToggle
                label="إخفاء Webdriver"
                description="إزالة علامات الأتمتة"
                checked={settings.stealth.hideWebdriver}
                onChange={() => toggleSetting('hideWebdriver')}
                recommended
              />
              <SettingToggle
                label="منطقة زمنية عشوائية"
                description="تغيير الموقع الجغرافي"
                checked={settings.stealth.randomTimezone}
                onChange={() => toggleSetting('randomTimezone')}
              />
              <SettingToggle
                label="لغة عشوائية"
                description="تنويع اللغة"
                checked={settings.stealth.randomLanguage}
                onChange={() => toggleSetting('randomLanguage')}
              />
              <SettingToggle
                label="إخفاء البصمة الرقمية"
                description="Canvas, WebGL, Audio"
                checked={settings.stealth.maskFingerprint}
                onChange={() => toggleSetting('maskFingerprint')}
                recommended
              />
            </div>
          </div>

          {/* Human Behavior */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="mb-4 flex items-center gap-2 text-blue-600">
              <Zap className="w-5 h-5" />
              <span>محاكاة السلوك البشري</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SettingToggle
                label="نقرات طبيعية"
                description="محاكاة حركة الماوس"
                checked={settings.stealth.humanClicks}
                onChange={() => toggleSetting('humanClicks')}
                recommended
              />
              <SettingToggle
                label="كتابة بشرية"
                description="سرعة كتابة متفاوتة"
                checked={settings.stealth.humanTyping}
                onChange={() => toggleSetting('humanTyping')}
                recommended
              />
              <SettingToggle
                label="تأخيرات عشوائية"
                description="فترات انتظار طبيعية"
                checked={settings.stealth.randomDelays}
                onChange={() => toggleSetting('randomDelays')}
              />
              <SettingToggle
                label="حركة الماوس"
                description="تحريك المؤشر بشكل طبيعي"
                checked={settings.stealth.mouseMovement}
                onChange={() => toggleSetting('mouseMovement')}
              />
              <SettingToggle
                label="تمرير طبيعي"
                description="Smooth scrolling"
                checked={settings.stealth.scrollBehavior}
                onChange={() => toggleSetting('scrollBehavior')}
              />
            </div>
          </div>

          {/* Advanced Protection */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="mb-4 flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              <span>حماية متقدمة</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SettingToggle
                label="حظر WebRTC"
                description="منع تسريب IP الحقيقي"
                checked={settings.stealth.blockWebRTC}
                onChange={() => toggleSetting('blockWebRTC')}
              />
              <SettingToggle
                label="تدوير Proxies"
                description="تغيير IP تلقائياً"
                checked={settings.stealth.rotateProxies}
                onChange={() => toggleSetting('rotateProxies')}
              />
              <SettingToggle
                label="مسح Cookies"
                description="تنظيف بعد كل مهمة"
                checked={settings.stealth.clearCookies}
                onChange={() => toggleSetting('clearCookies')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h4 className="mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="text-blue-900">💡 ملاحظة هامة</span>
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>جميع الإعدادات تُطبق تلقائياً على المهام الجديدة والإجراءات السريعة والمنشئ المرئي</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>التغييرات تُحفظ فوراً في المتصفح وتبقى بعد إعادة التحميل</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>عند النشر إلى GitHub، يتم تضمين إعدادات التخفي في سكريبتات التنفيذ</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ 
  label, 
  description, 
  checked, 
  onChange,
  recommended = false
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: () => void;
  recommended?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {recommended && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">موصى به</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </label>
  );
}