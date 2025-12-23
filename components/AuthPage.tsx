import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../hooks/useAuth';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthPageProps {
  onBack: () => void;
}

// التحقق من توفر بيئة Supabase
const isSupabaseConfigured = () => {
  try {
    // نتحقق إذا كانت بيئة Supabase مفعّلة بالفعل
    const config = (supabase as any);
    const url = config.supabaseUrl || '';
    const key = config.supabaseKey || '';
    
    // نعتبر Supabase مفعّلة إذا كانت البيانات موجودة وليست placeholder
    const hasValidUrl = url && url.startsWith('https://') && !url.includes('YOUR_');
    const hasValidKey = key && key.length > 20 && !key.includes('YOUR_');
    
    return hasValidUrl && hasValidKey;
  } catch {
    // في حال حصل خطأ، نفترض أن Supabase غير مفعلة
    return false;
  }
};

// دالة بديلة للمصادقة باستخدام localStorage
const localStorageAuth = {
  signIn: (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('current_user', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      }));
      return { data: user, error: null };
    }
    
    return { data: null, error: { message: 'بيانات الدخول غير صحيحة' } };
  },
  
  signUp: (email: string, password: string, fullName: string) => {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    
    // التحقق من عدم وجود البريد مسبقاً
    if (users.some((u: any) => u.email === email)) {
      return { data: null, error: { message: 'البريد الإلكتروني مستخدم بالفعل' } };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      email,
      password,
      full_name: fullName,
      created_at: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem('demo_users', JSON.stringify(users));
    localStorage.setItem('current_user', JSON.stringify({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
    }));
    
    return { data: newUser, error: null };
  },
};

// تهيئة الحسابات التجريبية عند أول تحميل
const initializeDemoAccounts = () => {
  const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
  
  const demoAccounts = [
    { id: 'demo_user_1', email: 'demo@automation-bot.com', password: 'demo123456', full_name: 'مستخدم تجريبي' },
    { id: 'demo_dev_1', email: 'dev@automation-bot.com', password: 'dev123456', full_name: 'مطور تجريبي' },
  ];
  
  // إضافة الحسابات التجريبية إذا لم تكن موجودة
  demoAccounts.forEach(demo => {
    if (!users.some((u: any) => u.email === demo.email)) {
      users.push({ ...demo, created_at: new Date().toISOString() });
    }
  });
  
  localStorage.setItem('demo_users', JSON.stringify(users));
};

export function AuthPage({ onBack }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp, resetPassword } = useAuth();

  // تهيئة الحسابات التجريبية عند التحميل
  useEffect(() => {
    // تهيئة حسابات تجريبية في localStorage كـ backup
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    
    if (users.length === 0) {
      const demoAccounts = [
        { 
          id: 'demo_user_1', 
          email: 'demo@botautomation.com', 
          password: 'Demo@123', 
          full_name: 'مستخدم تجريبي',
          created_at: new Date().toISOString()
        },
        { 
          id: 'demo_dev_1', 
          email: 'developer@botautomation.com', 
          password: 'Dev@123', 
          full_name: 'مطور تجريبي',
          created_at: new Date().toISOString()
        },
      ];
      
      localStorage.setItem('demo_users', JSON.stringify(demoAccounts));
    }
  }, []);

  // دالة للدخول السريع بحساب تجريبي
  const handleDemoLogin = async (demoType: 'user' | 'developer') => {
    setError('');
    setSuccess('');
    
    // تحديد بيانات الحساب التجريبي
    const demoAccounts = {
      user: { email: 'demo@botautomation.com', password: 'Demo@123', name: 'مستخدم تجريبي' },
      developer: { email: 'developer@botautomation.com', password: 'Dev@123', name: 'مطور تجريبي' }
    };

    const account = demoAccounts[demoType];
    
    // ملء الحقول تلقائياً
    setEmail(account.email);
    setPassword(account.password);
    setFullName(account.name);
    
    // إضافة رسالة توضيحية
    setSuccess(`تم ملء بيانات ${account.name} - اضغط "تسجيل الدخول" للمتابعة`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'فشل تسجيل الدخول');
        }
        setLoading(false);
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('الرجاء إدخال الاسم الكامل');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message || 'فشل إنشاء الحساب');
        }
        setLoading(false);
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message || 'فشل إرسال رابط إعادة التعيين');
        } else {
          setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  const getModeText = () => {
    switch (mode) {
      case 'signin':
        return {
          title: 'مرحباً بعودتك',
          description: 'سجل دخولك للوصول إلى لوحة التحكم',
          button: 'تسجيل الدخول',
          switchText: 'ليس لديك حساب؟',
          switchAction: 'إنشاء حساب جديد',
        };
      case 'signup':
        return {
          title: 'إنشاء حساب جديد',
          description: 'ابدأ رحلتك في أتمتة المهام',
          button: 'إنشاء الحساب',
          switchText: 'لديك حساب بالفعل؟',
          switchAction: 'تسجيل الدخول',
        };
      case 'reset':
        return {
          title: 'إعادة تعيين كلمة المرور',
          description: 'سنرسل لك رابط إعادة التعيين',
          button: 'إرسال الرابط',
          switchText: 'تذكرت كلمة المرور؟',
          switchAction: 'تسجيل الدخول',
        };
    }
  };

  const modeText = getModeText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl text-white">روبوت الأتمتة الذكي</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl text-white leading-tight"
            >
              أتمتة ذكية<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                بلا حدود
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400"
            >
              انضم إلى آلاف المستخدمين الذين يوفرون ساعات من العمل اليدوي يومياً
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1762330469123-ce98036eff16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cmUlMjBsb2dpbiUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzY1NjI4OTgzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Secure Technology"
                className="relative w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full"
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader>
              <div className="lg:hidden flex items-center gap-3 mb-4 cursor-pointer" onClick={onBack}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl text-white">روبوت الأتمتة</span>
              </div>
              <CardTitle className="text-2xl text-white">{modeText.title}</CardTitle>
              <CardDescription className="text-slate-400">{modeText.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400">{success}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="fullName" className="text-slate-300">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pr-10 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500"
                        required={mode === 'signup'}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('reset')}
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 pl-10 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="text-xs text-slate-500">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      {modeText.button}
                      <ArrowRight className="w-5 h-5 mr-2" />
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">أو</span>
                  </div>
                </div>

                {/* أزرار الدخول السريع بحساب تجريبي */}
                {mode === 'signin' && (
                  <div className="space-y-2">
                    <p className="text-center text-sm text-slate-400 mb-2">تجربة سريعة بحساب تجريبي</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                        onClick={() => handleDemoLogin('user')}
                        disabled={loading}
                      >
                        <User className="w-4 h-4 mr-2" />
                        مستخدم تجريبي
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                        onClick={() => handleDemoLogin('developer')}
                        disabled={loading}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        مطور تجريبي
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <span className="text-slate-400 text-sm">{modeText.switchText}</span>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                  >
                    {modeText.switchAction}
                  </button>
                </div>

                {mode === 'reset' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-slate-400 hover:text-slate-300 transition-colors text-sm"
                    >
                      ← العودة لتسجيل الدخول
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-slate-500 text-sm mt-6">
            بإنشاء حساب، أنت توافق على{' '}
            <button className="text-purple-400 hover:text-purple-300 transition-colors">
              شروط الخدمة
            </button>{' '}
            و{' '}
            <button className="text-purple-400 hover:text-purple-300 transition-colors">
              سياسة الخصوصية
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}