/**
 * Vercel Serverless Function - GitHub OAuth Initiator
 * 
 * يبدأ عملية OAuth مع GitHub
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // GitHub OAuth Config
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ 
      error: 'GITHUB_CLIENT_ID not configured' 
    });
  }
  
  // إنشاء state عشوائي للأمان
  const state = Math.random().toString(36).substring(7);
  
  // حفظ state في cookie للتحقق لاحقاً
  res.setHeader('Set-Cookie', `github_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
  
  // بناء URL للتوجيه
  const redirectUri = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/github/callback`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/callback`;
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'repo workflow');
  authUrl.searchParams.set('state', state);
  
  // توجيه المستخدم لصفحة GitHub
  res.redirect(302, authUrl.toString());
}
