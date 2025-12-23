import { motion } from 'motion/react';
import { Bot, Zap, Shield, Globe, Code, Database, ArrowRight, Check, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Bot,
      title: 'أتمتة ذكية',
      description: 'روبوت متقدم يتخذ قرارات بناءً على السياق والظروف',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500',
    },
    {
      icon: Shield,
      title: 'إخفاء متقدم',
      description: 'تقنيات stealth متطورة للتهرب من كاشفات الروبوتات',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500',
    },
    {
      icon: Zap,
      title: 'تنفيذ سريع',
      description: 'أداء عالي مع دعم Playwright و Puppeteer',
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500',
    },
    {
      icon: Globe,
      title: 'دعم شامل',
      description: 'يعمل على جميع المواقع مع قوالب جاهزة للمنصات الشهيرة',
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500',
    },
    {
      icon: Code,
      title: 'مرونة كاملة',
      description: 'بناء مرئي أو كود متقدم، الاختيار لك',
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-purple-600',
    },
    {
      icon: Database,
      title: 'تخزين آمن',
      description: 'قاعدة بيانات سحابية مع GitHub integration',
      gradient: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500',
    },
  ];

  const capabilities = [
    'جمع وتحليل البيانات من أي موقع',
    'تسجيل دخول تلقائي مع حفظ الجلسات',
    'إنشاء حسابات على المنصات المختلفة',
    'اختبار وظائف المواقع',
    'التقاط صور ومقاطع فيديو',
    'تعامل ذكي مع التحقق بالبريد الإلكتروني',
    'جدولة المهام والتنفيذ الدوري',
    'تصدير ونشر على GitHub',
  ];

  const stats = [
    { value: '100+', label: 'قوالب جاهزة' },
    { value: '99.9%', label: 'معدل النجاح' },
    { value: '24/7', label: 'عمل متواصل' },
    { value: '∞', label: 'إمكانيات لا محدودة' },
  ];

  return (
    <div className="landing-dark-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-white opacity-5" style={{ backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        
        <div className="relative">
          {/* Navigation */}
          <nav className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">روبوت الأتمتة الذكي</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6">
                  ابدأ الآن
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="container mx-auto px-6 py-16 md:py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-start"
              >
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 w-fit">
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs md:text-sm">أقوى منصة أتمتة في العالم العربي</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight font-bold">
                  أتمتة <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ذكية</span> لكل مهامك على الويب
                </h1>

                <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                  نظام متكامل لأتمتة المهام البشرية عبر الإنترنت مع ذكاء اصطناعي متقدم وتقنيات stealth للتهرب من كاشفات الروبوتات
                </p>

                <div className="flex gap-4 mb-12">
                  <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold">
                    ابدأ مجاناً
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }} size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 hover:text-white font-semibold">
                    استكشف الميزات
                  </Button>
                </div>

                {/* Stats - 4 Column Grid */}
                <div className="grid grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs md:text-sm text-slate-500">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Side - Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-3xl" />
                <div className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1761195696590-3490ea770aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdCUyMGF1dG9tYXRpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2NTcwNDg2M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Robot Automation"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4 font-bold">
              ميزات قوية لأتمتة شاملة
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              كل ما تحتاجه لأتمتة أي مهمة على الويب في منصة واحدة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 h-full backdrop-blur-sm">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-lg font-semibold">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Capabilities Section */}
      <div className="relative py-20 lg:py-32 capabilities-dark-bg">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-6 font-bold leading-tight">
                قدرات لا محدودة
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                من التسجيل التلقائي إلى التحليل المتقدم، روبوتنا يتعامل مع كل شيء
              </p>

              <div className="space-y-3">
                {capabilities.map((capability, index) => (
                  <motion.div
                    key={capability}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-300 text-sm sm:text-base leading-relaxed">{capability}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-1 lg:order-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-3xl rounded-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758411898021-ef0dadaaa295?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzY1NzAyNjA1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Dashboard Interface"
                  className="w-full h-auto object-cover aspect-square"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl rounded-2xl" />
            <Card className="relative bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/30 hover:border-purple-500/50 transition-colors duration-300 overflow-hidden">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-6 font-bold leading-tight">
                  جاهز للبدء؟
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  انضم إلى آلاف المستخدمين الذين يوفرون ساعات من العمل اليدوي يومياً
                </p>
                <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 sm:px-12">
                  ابدأ الآن مجاناً
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-sm sm:text-base font-medium">روبوت الأتمتة الذكي</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">
              © 2025 جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
