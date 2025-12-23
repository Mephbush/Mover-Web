import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';

// نظام مصادقة محلي كامل مُحسّن للأداء
const localAuth = {
  signUp: (email: string, password: string, fullName: string) => {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    if (users.some((u: any) => u.email === email)) {
      return { data: null, error: { message: 'البريد مستخدم' } };
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
    localStorage.setItem('current_user', JSON.stringify({ id: newUser.id, email: newUser.email, full_name: newUser.full_name }));
    return { data: { user: newUser }, error: null };
  },
  
  signIn: (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('current_user', JSON.stringify({ id: user.id, email: user.email, full_name: user.full_name }));
      return { data: { user }, error: null };
    }
    return { data: null, error: { message: 'بيانات خاطئة' } };
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تحميل فوري للمستخدم من localStorage بدون تأخير
    const currentUser = localStorage.getItem('current_user');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData as any);
        setSession({ user: userData } as any);
      } catch (e) {
        console.error('Error:', e);
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // تنفيذ فوري بدون تأخير
    const result = localAuth.signUp(email, password, fullName);
    if (result.data) {
      setUser(result.data.user as any);
      setSession({ user: result.data.user } as any);
    }
    return result;
  };

  const signIn = async (email: string, password: string) => {
    // تنفيذ فوري بدون تأخير
    const result = localAuth.signIn(email, password);
    if (result.data) {
      setUser(result.data.user as any);
      setSession({ user: result.data.user } as any);
    }
    return result;
  };

  const signOut = async () => {
    // تنفيذ فوري بدون تأخير
    localStorage.removeItem('current_user');
    setUser(null);
    setSession(null);
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    return { error: { message: 'تواصل مع الدعم لإعادة تعيين كلمة المرور' } };
  };

  return { user, session, loading, signUp, signIn, signOut, resetPassword };
}