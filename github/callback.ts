/**
 * Vercel Serverless Function - GitHub OAuth Callback
 * 
 * يستقبل code من GitHub ويحوله إلى access_token
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  
  // التحقق من وجود code
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code parameter' });
  }
  
  // التحقق من state للأمان
  const cookies = req.headers.cookie?.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  const savedState = cookies?.github_oauth_state;
  
  if (!savedState || savedState !== state) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }
  
  // GitHub OAuth Config
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'GitHub OAuth not configured properly' 
    });
  }
  
  try {
    // تبديل code بـ access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }
    
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received');
    }
    
    // الحصول على معلومات المستخدم
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const userData = await userResponse.json();
    
    // إنشاء HTML للنافذة المنبثقة يُرسل البيانات للـ parent window
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GitHub Authentication Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        .checkmark {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: scaleIn 0.5s ease-out;
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        h1 { margin: 0 0 1rem 0; }
        p { margin: 0; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="checkmark">✅</div>
        <h1>تم الربط بنجاح!</h1>
        <p>جاري إغلاق النافذة...</p>
      </div>
      <script>
        // إرسال البيانات للـ parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'github-auth-success',
            token: ${JSON.stringify(accessToken)},
            user: ${JSON.stringify({
              login: userData.login,
              name: userData.name,
              avatar_url: userData.avatar_url,
              email: userData.email
            })}
          }, window.location.origin);
          
          // إغلاق النافذة بعد ثانية
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // إذا لم تكن نافذة منبثقة، التوجيه للصفحة الرئيسية
          setTimeout(() => {
            window.location.href = '/?github_token=' + ${JSON.stringify(accessToken)};
          }, 1500);
        }
      </script>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error: any) {
    console.error('GitHub OAuth Error:', error);
    
    // صفحة خطأ
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          max-width: 400px;
        }
        .error-icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { margin: 0 0 1rem 0; }
        p { margin: 0; opacity: 0.9; font-size: 0.9rem; }
        button {
          margin-top: 2rem;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          background: white;
          color: #f5576c;
          font-weight: bold;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>فشل الربط</h1>
        <p>${error.message || 'حدث خطأ غير متوقع'}</p>
        <button onclick="window.close()">إغلاق</button>
      </div>
    </body>
    </html>
    `;
    
    res.status(500).send(errorHtml);
  }
}
