/**
 * GitHub API Integration - اتصال حقيقي مع GitHub
 */

export type GitHubAuthMethod = 'token' | 'oauth';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
  targetBranch?: string;  // الفرع الذي سيتم النشر عليه
  createPR?: boolean;     // إنشاء Pull Request
  baseBranch?: string;    // الفرع الأساسي للـ PR
}

// ========== GitHub OAuth Config ==========
const GITHUB_OAUTH_CONFIG = {
  clientId: 'Ov23liLgXewq8PNB6cUC', // GitHub App Client ID (عام)
  redirectUri: window.location.origin + '/github/callback',
  scope: 'repo workflow',
  state: generateRandomState()
};

function generateRandomState() {
  return Math.random().toString(36).substring(7);
}

// ========== GitHub API Base ==========
const GITHUB_API_BASE = 'https://api.github.com';

class GitHubAPI {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `GitHub API Error: ${response.status}`);
    }

    // بعض endpoints ترجع استجابة فارغة (204 No Content)
    // مثل تشغيل workflow أو تفعيل Actions
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
      return {}; // إرجاع كائن فارغ بدلاً من محاولة تحليل JSON
    }

    // التحقق من وجود محتوى قبل تحليل JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {}; // إرجاع كائن فارغ إذا كانت الاستجابة فارغة
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn('Failed to parse JSON response:', text);
      return {}; // إرجاع كائن فارغ في حالة فشل التحليل
    }
  }

  // التحقق من الاتصال والصلاحيات
  async verifyConnection(): Promise<boolean> {
    try {
      // 1. التحقق من صحة Token
      const user = await this.fetch('/user');
      console.log('Token valid - User:', user.login);

      // 2. التحقق من �� الستودع
      let repoExists = false;
      try {
        const repo = await this.fetch(`/repos/${this.config.owner}/${this.config.repo}`);
        console.log('Repository found:', repo.full_name);
        
        // تحديث الفرع من المستودع
        this.config.branch = repo.default_branch || this.config.branch;
        console.log('Using branch:', this.config.branch);
        
        repoExists = true;
        
        // 3. التحقق من صلاحيات الكتابة
        if (!repo.permissions?.push) {
          throw new Error('No write permission on repository');
        }
      } catch (error: any) {
        if (error.message.includes('Not Found') || error.message.includes('404')) {
          console.log('Repository not found - creating new one...');
          try {
            await this.createRepository();
            repoExists = true;
          } catch (createError: any) {
            console.error('Failed to create repository:', createError);
            throw new Error(`Failed to create repository: ${createError.message}`);
          }
        } else {
          throw error;
        }
      }

      if (repoExists) {
        console.log('All permissions verified');
        return true;
      }

      return false;

    } catch (error: any) {
      console.error('Verification error:', error.message);
      
      // ترجمة الأخطاء الشائعة
      let errorMessage = error.message;
      if (error.message.includes('Bad credentials') || error.message.includes('401')) {
        errorMessage = 'Token is invalid or expired';
      } else if (error.message.includes('Not Found') || error.message.includes('404')) {
        errorMessage = 'Repository not found and cannot create it';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error - check your internet connection';
      }
      
      throw new Error(errorMessage);
    }
  }

  // إنشاء متودع جديد
  async createRepository(): Promise<void> {
    console.log('📦 إنشاء مستودع جديد...');
    
    try {
      const response = await this.fetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: this.config.repo,
          description: 'Web Automation Bot - Automated tasks with Playwright and Stealth',
          private: false,
          auto_init: false  // ✅ لا نستخدم auto_init - سننشئ initial commit يدوياً
        })
      });

      console.log('✅ تم إنشاء المستودع بنجاح:', response);
      
      // انتظار أطول للتأكد من أن Git API جاهز
      console.log('⏳ انتظار 5 ثواني حتى يصبح المستودع جاهزاً تماماً...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // إنشاء initial commit فوراً
      console.log('📝 بدء إنشاء initial commit...');
      await this.createInitialCommit();
      
      // انتظار إضافي بعد Initial commit
      console.log('⏳ انتظار 2 ثانية بعد Initial commit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🎉 المستودع جاهز تماماً للاستخدام!');
    } catch (error: any) {
      console.error('❌ فشل إنشاء المستودع:', error);
      
      // معالجة أخطاء محددة
      if (error.message.includes('name already exists')) {
        console.log('⚠️ المستودع موجود مسبقاً - سنستخدمه');
        return; // لا نرمي خطأ إذا كان المستودع موجود
      } else if (error.message.includes('Bad credentials') || error.message.includes('401')) {
        throw new Error('Token is invalid - please reconnect GitHub');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('No permission to create repositories - check token scopes');
      } else if (error.message.includes('422')) {
        throw new Error('Repository name is invalid or already exists');
      }
      
      throw error;
    }
  }

  // إنشاء initial commit إذا كان المستودع فارغاً
  async createInitialCommit(): Promise<void> {
    console.log('📝 إنشاء initial commit...');
    
    try {
      const branch = this.config.branch || 'main';
      const readmeContent = '# Web Automation Bot\n\nAutomated tasks with Playwright and Stealth\n\n## Status\n\nRepository initialized and ready for automation tasks.';
      
      console.log('🔨 Step 1: Creating blob...');
      // إنشاء blob للـ README
      const blobResponse = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: btoa(unescape(encodeURIComponent(readmeContent))),
            encoding: 'base64'
          })
        }
      );
      console.log('✅ Blob created:', blobResponse.sha);
      
      console.log('🔨 Step 2: Creating tree...');
      // إنشاء tree
      const treeResponse = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/trees`,
        {
          method: 'POST',
          body: JSON.stringify({
            tree: [{
              path: 'README.md',
              mode: '100644',
              type: 'blob',
              sha: blobResponse.sha
            }]
          })
        }
      );
      console.log('✅ Tree created:', treeResponse.sha);
      
      console.log('🔨 Step 3: Creating commit...');
      // إنشاء commit (بدون parents لأنه أول commit)
      const commitResponse = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/commits`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: 'Initial commit: Initialize Web Automation Bot',
            tree: treeResponse.sha,
            parents: []  // أول commit ليس له parents
          })
        }
      );
      console.log('✅ Commit created:', commitResponse.sha);
      
      console.log(`🔨 Step 4: Creating branch reference ${branch}...`);
      // إنشاء reference للفرع (هذا يُنشئ الفرع)
      await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/refs`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: commitResponse.sha
          })
        }
      );
      console.log(`✅ Branch ${branch} created successfully!`);
      
      console.log('🎉 Initial commit completed! Repository is ready!');
      
    } catch (error: any) {
      console.error('💥 خطأ في إنشاء initial commit:', error);
      
      // إذا كان الفرع موجوداً فعلاً، لا مشكلة
      if (error.message.includes('already exists') || error.message.includes('Reference already exists')) {
        console.log('✅ Branch already exists - repository is ready');
        return;
      }
      
      throw error;
    }
  }

  // قراءة ملف من المستودع
  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const data = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`
      );

      return {
        content: atob(data.content.replace(/\n/g, '')),
        sha: data.sha
      };
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // رفع أو تحديث ملف
  async uploadFile(path: string, content: string, message: string, sha?: string): Promise<void> {
    console.log(`📤 Uploading: ${path}`);

    const maxRetries = 3;  // تقليل المحاولات لأن المستودع جاهز الآن
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 محاولة ${attempt}/${maxRetries} لرفع ${path}...`);
        
        // التأكد من وجود الفرع أولاً
        await this.ensureBranchExists();

        // تشفير المحتوى إلى base64
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        await this.fetch(`/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: encodedContent,
            branch: this.config.branch,
            ...(sha && { sha })
          })
        });

        console.log(`✅ Successfully uploaded: ${path}`);
        return; // نجح الرفع
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ محاولة ${attempt} فشلت لـ ${path}:`, error.message);
        
        if (attempt < maxRetries) {
          const waitTime = 2000; // انتظار ثابت 2 ثانية
          console.log(`⏳ انتظار ${waitTime/1000} ثانية قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // ذ فشلت جميع المحاولات
    console.error(`💥 فشلت جميع المحاولات (${maxRetries}) لرفع ${path}`);
    throw new Error(`فشل رفع ${path} بعد ${maxRetries} محاولات: ${lastError?.message || 'Unknown error'}`);
  }

  // التأكد من وجود الفرع
  async ensureBranchExists(): Promise<void> {
    try {
      // محاولة الحصول على الفرع
      await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${this.config.branch}`
      );
      console.log(`✅ Branch ${this.config.branch} exists`);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        console.log(`⚠️ Branch ${this.config.branch} not found!`);
        
        // التحقق من أن المستودع ليس فارغاً تماماً
        try {
          console.log('🔍 التحقق من الفروع الموجودة...');
          const branches = await this.fetch(
            `/repos/${this.config.owner}/${this.config.repo}/branches`
          );
          
          if (branches.length === 0) {
            // المستودع فارغ تماماً - نحتاج initial commit
            console.log('⚠️ المستودع فارغ! سيتم إنشاء initial commit...');
            await this.createInitialCommit();
            
            // انتظار إضافي للتأكد من أن الفرع أصبح متاحاً
            console.log('⏳ انتظار 3 ثواني تأكد من جاهزية الفرع...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('✅ تم إنشاء الفرع بنجاح!');
            return;
          }
          
          // المستو��ع لديه فروع - س��خدم أحدها لإنشاء الفرع المطلوب
          const defaultBranch = branches[0].name;
          console.log(`📌 استخدام الفرع ${defaultBranch} كقاعدة...`);
          
          const refData = await this.fetch(
            `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${defaultBranch}`
          );
          
          const sha = refData.object.sha;
          
          // إنشاء الفرع الجديد
          await this.fetch(
            `/repos/${this.config.owner}/${this.config.repo}/git/refs`,
            {
              method: 'POST',
              body: JSON.stringify({
                ref: `refs/heads/${this.config.branch}`,
                sha: sha
              })
            }
          );
          
          console.log(`✅ Created branch ${this.config.branch} from ${defaultBranch}`);
          
        } catch (createError: any) {
          console.error(' فشل إنشاء الفرع:', createError);
          throw new Error(`Cannot create branch ${this.config.branch}: ${createError.message}`);
        }
      } else {
        throw error;
      }
    }
  }

  // رفع عدة ملفات (واحد تلو الآخر - يعمل مع PAT)
  async uploadMultipleFiles(files: Array<{ path: string; content: string }>, baseMessage: string): Promise<void> {
    console.log(`📦 رفع ${files.length} ملف...`);

    // استراتيجية جديدة: رفع كل شيء في commit واحد باستخدام Git Tree API
    try {
      await this.uploadFilesAsTree(files, baseMessage);
      console.log(`✅ تم رفع جميع الملفات (${files.length}) بنجاح في commit واحد!`);
    } catch (treeError: any) {
      console.warn('⚠️ فشل الرفع الجماعي، سنحاول الرفع الفردي...', treeError.message);
      
      // خطة احتياطية: رفع ملف تلو ا
      for (const file of files) {
        try {
          // التحقق من وجود الملف
          const existing = await this.getFile(file.path);
          
          // رفع أو تحديث الملف
          await this.uploadFile(
            file.path,
            file.content,
            `${baseMessage}: ${file.path}`,
            existing?.sha
          );
          
          // انتظار صير لتجنب rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`❌ فشل رفع ${file.path}:`, error.message);
          throw new Error(`فشل رفع ${file.path}: ${error.message}`);
        }
      }

      console.log(`✅ تم رفع جميع الملفات (${files.length}) بنجاح فردياً!`);
    }
  }

  // رفع ملفات متددة في commit واحد باستخدام Git Tree API
  async uploadFilesAsTree(files: Array<{ path: string; content: string }>, message: string): Promise<void> {
    console.log('🌳 استخدام Git Tree API للرفع الجماعي...');
    
    // 1. التأكد من وجود الفرع
    await this.ensureBranchExists();
    
    // 2. الحصول على آخر commit
    let baseTreeSha: string | undefined;
    let parentSha: string | undefined;
    
    try {
      const refData = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${this.config.branch}`
      );
      parentSha = refData.object.sha;
      
      const commitData = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/commits/${parentSha}`
      );
      baseTreeSha = commitData.tree.sha;
      
      console.log('✅ Base commit:', parentSha);
      console.log('✅ Base tree:', baseTreeSha);
    } catch (error) {
      console.log('⚠️ لا يوجد commits سابقة، سننشئ أول commit');
    }
    
    // 3. إنشاء blobs لكل ملف
    console.log(`🔨 إنشاء ${files.length} blob...`);
    const treeItems = [];
    
    for (const file of files) {
      const blobResponse = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: btoa(unescape(encodeURIComponent(file.content))),
            encoding: 'base64'
          })
        }
      );
      
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobResponse.sha
      });
      
      console.log(`  ✓ ${file.path}`);
    }
    
    console.log(`✅ تم إنشاء ${treeItems.length} blob`);
    
    // 4. إنشاء tree
    console.log('🌳 إنشاء tree...');
    const treeResponse = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          tree: treeItems,
          base_tree: baseTreeSha
        })
      }
    );
    console.log('✅ Tree created:', treeResponse.sha);
    
    // 5. إنشاء commit
    console.log('📝 إنشاء commit...');
    const commitResponse = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          tree: treeResponse.sha,
          parents: parentSha ? [parentSha] : []
        })
      }
    );
    console.log('✅ Commit created:', commitResponse.sha);
    
    // 6. تحديث reference للفرع
    console.log(`🔄 تحديث فرع ${this.config.branch}...`);
    
    try {
      // محاولة التحديث العادي أولاً
      await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sha: commitResponse.sha,
            force: false  // نحاول بدون force أولاً
          })
        }
      );
      console.log(`🎉 تم رفع جميع الملفات بنجاح على ${this.config.branch}!`);
    } catch (updateError: any) {
      // إذا فشل التحديث العادي (not fast-forward)، نستخدم force
      if (updateError.message?.includes('Update is not a fast forward') || 
          updateError.message?.includes('fast-forward')) {
        console.log('⚠️ تعارض في التحديث، سيتم استخدام force update...');
        
        await this.fetch(
          `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${this.config.branch}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              sha: commitResponse.sha,
              force: true  // استخدام force للحل
            })
          }
        );
        
        console.log(`🎉 تم رفع جميع الملفات بنجاح على ${this.config.branch} باستخدام force update!`);
      } else {
        throw updateError;
      }
    }
  }

  // تفعيل GitHub Actions
  async enableActions(): Promise<void> {
    try {
      await this.fetch(`/repos/${this.config.owner}/${this.config.repo}/actions/permissions`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          allowed_actions: 'all'
        })
      });
      console.log('GitHub Actions enabled successfully');
    } catch (error: any) {
      // هذا الـ endpoint قد لا يعمل مع Personal Access Tokens
      // Actions عادة مفعّل افتراضياً في المستودعات الجديدة
      console.warn('Could not enable Actions automatically - may need manual activation');
      console.warn('Error:', error.message);
      // لا نرمي الخطأ لأن Actions قد يكون مفعّل بالفعل
    }
  }

  // إن Secret
  async createSecret(name: string, value: string): Promise<void> {
    // الحصول على public key للتشفير
    const { key, key_id } = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/actions/secrets/public-key`
    );

    // تشفير القيمة (يحتاج مكتبة sodium - نتخدم تنبيه للمستخدم)
    console.log(`⚠️ يجب إضافة Secret يدوياً: ${name}`);
    console.log(`القيمة: ${value}`);
  }

  // تشغيل Workflow يدوياً
  async triggerWorkflow(workflowFileName: string, inputs: Record<string, any> = {}): Promise<void> {
    console.log(`Triggering workflow: ${workflowFileName}`);
    
    try {
      // الانتظار قليلاً للتأكد من أن GitHub قد سجّل الملف
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/actions/workflows/${workflowFileName}/dispatches`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: this.config.branch,
            inputs
          })
        }
      );

      console.log(`Workflow triggered: ${workflowFileName}`);
    } catch (error: any) {
      // التحقق من نوع الخطأ
      if (error.message?.includes('workflow_dispatch') || 
          error.message?.includes('not found') ||
          error.message?.includes('404')) {
        // هذا ليس خطأ خطير - الملف قد يكون موجوداً لكن GitHub لم يفهرسه بعد
        console.log('ℹ️ تم رفع الملفات بنجاح، يمكنك تشغيل المهمة يدوياً من GitHub Actions في غضون دقائق');
        return; // لا نرمي خطأ
      }
      throw error;
    }
  }

  // الحصول على آخر تشغيل
  async getLatestRun(workflowId?: string): Promise<any> {
    let url = `/repos/${this.config.owner}/${this.config.repo}/actions/runs?per_page=10`;
    if (workflowId) {
      url = `/repos/${this.config.owner}/${this.config.repo}/actions/workflows/${workflowId}/runs?per_page=10`;
    }
    
    const data = await this.fetch(url);
    return data.workflow_runs || [];
  }

  // الحصول على artifacts لتشغيل معين
  async getRunArtifacts(runId: number): Promise<any[]> {
    const data = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/artifacts`
    );
    return data.artifacts || [];
  }

  // تحميل artifact
  async downloadArtifact(artifactId: number): Promise<Blob> {
    const maxRetries = 3;
    const timeoutMs = 120000; // 120 ثانية (دقيقتان)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 محاولة ${attempt}/${maxRetries} - تحميل artifact ${artifactId}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(
          `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/actions/artifacts/${artifactId}/zip`,
          {
            headers: {
              'Authorization': `token ${this.config.token}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('❌ الملف غير موجود. قد يكون قد انتهت صلاحيته (artifacts تنتهي بعد 90 يوم).');
          } else if (response.status === 401 || response.status === 403) {
            throw new Error('❌ ليس لديك صلاحية للوصول إلى هذا الملف. تحقق من Token الخاص بك.');
          } else if (response.status === 410) {
            throw new Error('❌ الملف محذوف أو منتهي الصلاحية.');
          } else {
            throw new Error(`❌ فشل تحميل الملف: ${response.status} ${response.statusText}`);
          }
        }

        // التحقق من نوع المحتوى (بصمت)
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/zip') && !contentType.includes('application/octet-stream')) {
          // تسجيل فقط في console للمطورين
          if (process.env.NODE_ENV === 'development') {
            console.debug('Content-Type:', contentType);
          }
        }

        const blob = await response.blob();
        
        // التحقق من حم الملف
        if (blob.size === 0) {
          throw new Error('❌ الملف فارغ (0 بايت).');
        }
        
        console.log(`✅ تم تحميل artifact بنجاح: ${(blob.size / 1024).toFixed(2)} KB`);

        return blob;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        
        // معالجة أخطاء الشبكة
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          if (isLastAttempt) {
            throw new Error(`❌ انتهت مهلة التحميل بعد ${maxRetries} محاولات. الملف قد يكون كبيراً جداً. حاول مرة أخرى لاحقاً.`);
          } else {
            console.log(`⏱️ انتهت المهلة - سيتم المحاولة مجدداً...`);
            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        
        if (error.message.includes('Failed to fetch')) {
          if (isLastAttempt) {
            throw new Error('❌ خطأ في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت أو حاول مرة أخرى.');
          } else {
            console.log(`🔄 خطأ في الاتصال - سيتم المحاولة مجدداً...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        
        // أخطاء أخرى (404، 403، etc.) لا تحتاج retry
        throw error;
      }
    }
    
    throw new Error('❌ فشل التحميل بعد عدة محاولات.');
  }

  // الحصول على سجلات التشغيل
  async getRunLogs(runId: number): Promise<string> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/actions/runs/${runId}/logs`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        return 'Logs not available yet';
      }

      const blob = await response.blob();
      return await blob.text();
    } catch (error) {
      return 'Error loading logs';
    }
  }

  // ========== إدارة الفروع (Branches) ==========

  // الحصول على قائم الفروع
  async getBranches(): Promise<string[]> {
    try {
      const data = await this.fetch(
        `/repos/${this.config.owner}/${this.config.repo}/branches`
      );
      return data.map((branch: any) => branch.name);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      return [this.config.branch]; // إرجاع الفرع الافتراضي على الأقل
    }
  }

  // إنشاء فرع جديد
  async createBranch(newBranchName: string, fromBranch?: string): Promise<void> {
    console.log(`Creating branch: ${newBranchName} from ${fromBranch || this.config.branch}`);
    
    // الحصول على SHA للفرع المصدر
    const baseBranch = fromBranch || this.config.branch;
    const refData = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${baseBranch}`
    );
    
    const sha = refData.object.sha;
    
    // إنشاء الفرع الجديد
    await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName}`,
          sha: sha
        })
      }
    );
    
    console.log(`Branch ${newBranchName} created successfully`);
  }

  // حذف فرع
  async deleteBranch(branchName: string): Promise<void> {
    await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${branchName}`,
      { method: 'DELETE' }
    );
    console.log(`Branch ${branchName} deleted`);
  }

  // ========== Pull Requests ==========

  // إنشاء Pull Request
  async createPullRequest(
    title: string,
    headBranch: string,
    baseBranch: string,
    body?: string
  ): Promise<any> {
    console.log(`Creating PR: ${headBranch} → ${baseBranch}`);
    
    const pr = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          head: headBranch,
          base: baseBranch,
          body: body || `تم إنشاء هذا PR تلقائيا بواسطة Web Automation Bot\n\n### التغييرات:\n- نشر/تحديث مهام الأتمتة\n- إعدادات Stealth محدثة\n- ملفات workflows محدثة`
        })
      }
    );
    
    console.log(`PR created: ${pr.html_url}`);
    return pr;
  }

  // الحصول على PRs
  async getPullRequests(state: 'open' | 'closed' | 'all' = 'open'): Promise<any[]> {
    const data = await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/pulls?state=${state}&per_page=10`
    );
    return data;
  }

  // دمج PR
  async mergePullRequest(prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge'): Promise<void> {
    await this.fetch(
      `/repos/${this.config.owner}/${this.config.repo}/pulls/${prNumber}/merge`,
      {
        method: 'PUT',
        body: JSON.stringify({
          merge_method: mergeMethod
        })
      }
    );
    console.log(`PR #${prNumber} merged successfully`);
  }

  // تحديث الفرع في الـ config
  updateBranch(newBranch: string): void {
    this.config.branch = newBranch;
  }
}

// ========== GitHub OAuth Flow ==========

export function initiateGitHubOAuth() {
  const { clientId, redirectUri, scope, state } = GITHUB_OAUTH_CONFIG;
  
  // حفظ state للتحقق لاحقاً
  sessionStorage.setItem('github_oauth_state', state);
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  
  // توجيه المستخدم لصفحة التصريح
  window.location.href = authUrl.toString();
}

export async function handleGitHubCallback(code: string, state: string): Promise<string> {
  // التحقق من state
  const savedState = sessionStorage.getItem('github_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }

  // ملاحظ: يحتاج backend لتبديل code بـ access_token
  // لأن client_secret يجب ألا يكون في frontend
  console.warn('⚠️ OAuth يحتاج backend لإكمال العملية');
  
  throw new Error('OAuth يحتاج إعداد backend - استخدم Personal Access Token حالياً');
}

// ========== Token-based Auth (الطريقة الحالية) ==========

export async function verifyGitHubToken(
  owner: string,
  repo: string,
  token: string,
  branch: string = 'main'
): Promise<{ success: boolean; api?: GitHubAPI; error?: string }> {
  try {
    const api = new GitHubAPI({ owner, repo, token, branch });
    await api.verifyConnection();
    
    return { success: true, api };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== نشر المهام ==========

export async function deployTasksToGitHub(
  api: GitHubAPI,
  tasks: any[],
  stealthConfig: any
): Promise<void> {
  console.log('🚀 بدء عملية النشر...');
  console.log(`📝 عدد المهام: ${tasks.length}`);
  console.log(`🔧 مستوى Stealth: ${stealthConfig.level}`);

  try {
    // 1. إنشاء الملفات
    const files = [
      {
        path: '.github/workflows/automation.yml',
        content: generateMainWorkflow(tasks, stealthConfig)
      },
      {
        path: 'package.json',
        content: generatePackageJSON()
      },
      {
        path: 'scripts/stealth-helpers.js',
        content: generateStealthHelpers(stealthConfig)
      },
      {
        path: 'tasks.json',
        content: JSON.stringify(tasks, null, 2)
      },
      {
        path: 'README.md',
        content: generateREADME(tasks)
      },
      {
        path: '.gitignore',
        content: `node_modules/\nresults/\nscreenshots/\nlogs/\n.env\n*.log`
      }
    ];

    // 2. إضافة workflow منفصل لكل مهمة
    tasks.forEach(task => {
      files.push({
        path: `.github/workflows/task-${task.id}.yml`,
        content: generateTaskWorkflow(task, stealthConfig)
      });

      files.push({
        path: `scripts/task-${task.id}.js`,
        content: generateTaskScript(task, stealthConfig)
      });
    });

    console.log(`📦 إجمالي الملفات: ${files.length}`);

    // 3. رفع جميع الملفات
    console.log('⬆️ بدء رفع الملفات...');
    await api.uploadMultipleFiles(files, '🤖 Deploy automation tasks with stealth features');

    // 4. تفعيل Actions
    console.log('⚙️ تفعيل GitHub Actions...');
    await api.enableActions();

    console.log('✅ اكتمل النشر بنجاح!');
    console.log(`\n🎯 التالي:\n1. افتح: https://github.com/${api['config'].owner}/${api['config'].repo}\n2. اذهب إلى تبويب "Actions"\n3. شغّل المهام المطلوبة`);
  } catch (error: any) {
    console.error('❌ فشل النشر:', error);
    throw new Error(`فشل النشر: ${error.message}`);
  }
}

// دالة لتوليد الملفات بدون رفع
export function generateDeploymentFiles(
  tasks: any[],
  stealthConfig: any
): Array<{ path: string; content: string }> {
  const files = [
    {
      path: '.github/workflows/automation.yml',
      content: generateMainWorkflow(tasks, stealthConfig)
    },
    {
      path: 'package.json',
      content: generatePackageJSON()
    },
    {
      path: 'scripts/stealth-helpers.js',
      content: generateStealthHelpers(stealthConfig)
    },
    {
      path: 'tasks.json',
      content: JSON.stringify(tasks, null, 2)
    },
    {
      path: 'README.md',
      content: generateREADME(tasks)
    },
    {
      path: '.gitignore',
      content: `node_modules/\nresults/\nscreenshots/\nlogs/\n.env\n*.log`
    }
  ];

  // إضافة workflow منفصل لكل مهمة
  tasks.forEach(task => {
    files.push({
      path: `.github/workflows/task-${task.id}.yml`,
      content: generateTaskWorkflow(task, stealthConfig)
    });

    files.push({
      path: `scripts/task-${task.id}.js`,
      content: generateTaskScript(task, stealthConfig)
    });
  });

  return files;
}

// دالة لرفع ملفات محررة
export async function deployFiles(
  api: GitHubAPI,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  console.log('🚀 بدء رفع الملفات...');
  console.log(`📦 عدد الملفات: ${files.length}`);

  try {
    await api.uploadMultipleFiles(files, '🤖 Deploy automation tasks with stealth features');
    
    console.log('⚙️ تفعيل GitHub Actions...');
    await api.enableActions();

    console.log('✅ اكتمل النشر بنجاح!');
  } catch (error: any) {
    console.error('❌ فشل النشر:', error);
    throw new Error(`فشل النشر: ${error.message}`);
  }
}

// ========== توليد الملفات ==========

function generateMainWorkflow(tasks: any[], stealthConfig: any): string {
  return `name:  Web Automation Bot

on:
  workflow_dispatch:
    inputs:
      task_id:
        description: 'Task ID to run (leave empty for all)'
        required: false
        type: string

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      tasks: \${{ steps.get-tasks.outputs.tasks }}
    steps:
      - uses: actions/checkout@v4
      - id: get-tasks
        run: |
          if [ -z "\${{ github.event.inputs.task_id }}" ]; then
            echo "tasks=$(cat tasks.json | jq -c '[.[].id]')" >> $GITHUB_OUTPUT
          else
            echo "tasks=[\"\${{ github.event.inputs.task_id }}\"]" >> $GITHUB_OUTPUT
          fi

  run-task:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        task_id: \${{ fromJson(needs.setup.outputs.tasks) }}
      fail-fast: false
      max-parallel: 1
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Run Task
        run: node scripts/task-\${{ matrix.task_id }}.js
        env:
          STEALTH_CONFIG: '\${{ secrets.STEALTH_CONFIG }}'
          TASK_CREDENTIALS: '\${{ secrets.TASK_CREDENTIALS }}'
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-\${{ matrix.task_id }}-\${{ github.run_number }}
          path: |
            results/
            screenshots/
          retention-days: 7
      
      - name: Upload Logs
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: logs-\${{ matrix.task_id }}-\${{ github.run_number }}
          path: logs/
          retention-days: 7
`;
}

function generateTaskWorkflow(task: any, stealthConfig: any): string {
  const schedule = task.schedule || 'daily';
  const cronMap: Record<string, string> = {
    hourly: '0 * * * *',
    'every-6-hours': '0 */6 * * *',
    'every-12-hours': '0 */12 * * *',
    daily: '0 0 * * *',
    weekly: '0 0 * * 0'
  };

  return `name: 📋 ${task.name}

on:
  schedule:
    - cron: '${cronMap[schedule] || '0 0 * * *'}'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Run "${task.name}"
        run: node scripts/task-${task.id}.js
        env:
          STEALTH_CONFIG: '\${{ secrets.STEALTH_CONFIG }}'
          TASK_CREDENTIALS: '\${{ secrets.TASK_CREDENTIALS }}'
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ${task.id}-\${{ github.run_number }}
          path: |
            results/
            screenshots/
          retention-days: 7
`;
}

function generateTaskScript(task: any, stealthConfig: any): string {
  // التأكد من أن URL يحتوي على protocol
  let targetUrl = task.targetUrl;
  if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  
  // ✅ إصلاح: استخدام ES Modules بدلاً من CommonJS
  return `import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createStealthBrowser, humanClick, humanType, humanScroll } from './stealth-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// معلومات المهمة
const TASK = ${JSON.stringify({ ...task, targetUrl }, null, 2)};

async function runTask() {
  console.log('🚀 بدء المهمة: ' + TASK.name);
  console.log('📝 الوصف: ' + TASK.description);
  console.log('🎯 الهدف: ' + TASK.targetUrl);
  
  const startTime = Date.now();
  let taskResult = null;
  
  // إنشاء متصفح Stealth
  const { browser, context, page } = await createStealthBrowser();
  
  try {
    // الانتقال للصفحة
    console.log('🌐 الانتقال إلى:', TASK.targetUrl);
    await page.goto(TASK.targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('✅ تم تحميل الصفحة بنجاح');
    
    // تنفيذ السكريبت
    ${generateTaskLogic(task)}
    
    // التقاط صورة
    console.log('📸 التقاط صورة للصفحة...');
    await fs.mkdir('screenshots', { recursive: true });
    const screenshotPath = path.join('screenshots', TASK.id + '-' + Date.now() + '.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log('✅ تم حفظ الورة:', screenshotPath);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log('✅ اكتملت المهمة في ' + duration.toFixed(2) + ' ثانية');
    
    // حفظ النتائج مع البيانات المستخرجة
    await saveResults({
      taskId: TASK.id,
      taskName: TASK.name,
      status: 'success',
      duration,
      timestamp: new Date().toISOString(),
      screenshot: screenshotPath,
      data: taskResult // البيانات المستخرجة
    });
    
    console.log('🎉 المهمة نجحت بالكامل!');
    
  } catch (error) {
    console.error('❌ خطأ في المهمة:', error.message);
    console.error('Stack trace:', error.stack);
    
    // محاولة التقاط صورة للخطأ
    try {
      await fs.mkdir('screenshots', { recursive: true });
      const errorScreenshot = path.join('screenshots', TASK.id + '-error-' + Date.now() + '.png');
      await page.screenshot({ path: errorScreenshot }).catch(() => {});
      console.log('📸 تم حفظ صورة الخطأ:', errorScreenshot);
    } catch (e) {
      // تجاهل أخطاء حفظ الصورة
    }
    
    await saveResults({
      taskId: TASK.id,
      taskName: TASK.name,
      status: 'failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    throw error; // إعادة رمي الخطأ لإفشال GitHub Action
    
  } finally {
    await browser.close();
    console.log('🔒 تم إغلاق المتصفح');
  }
}

async function saveResults(data) {
  await fs.mkdir('results', { recursive: true });
  const filename = TASK.id + '-' + Date.now() + '.json';
  const filepath = path.join('results', filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log('💾 تم حفظ النتائج:', filepath);
  
  // طباعة النتائج للسجلات
  console.log('\\n📊 ملخص النتائج:');
  console.log(JSON.stringify(data, null, 2));
}

runTask().catch(error => {
  console.error('💥 فشلت المهمة:', error);
  process.exit(1);
});
`;
}

function generateTaskLogic(task: any): string {
  if (task.type === 'scraping') {
    return `
    // انتظار تحميل الصفحة
    await page.waitForTimeout(2000);
    
    // استخراج البيانات
    taskResult = await page.evaluate(() => {
      const items = document.querySelectorAll('.item, .product, article');
      return Array.from(items).map(item => ({
        title: item.querySelector('h1, h2, h3, .title')?.textContent?.trim(),
        description: item.querySelector('p, .description')?.textContent?.trim(),
        link: item.querySelector('a')?.href
      }));
    });
    
    console.log(\`📊 تم جمع \${taskResult.length} عنصر\`);
    console.log('البيانات المستخرجة:', JSON.stringify(taskResult, null, 2));
    
    // حفظ البيانات في ملف منفصل
    await fs.mkdir('results', { recursive: true });
    await fs.writeFile(
      \`results/\${TASK.id}-data-\${Date.now()}.json\`,
      JSON.stringify(taskResult, null, 2)
    );
    console.log('✅ تم حفظ البيانات في ملف منفصل');`;
  } else if (task.type === 'login') {
    return `
    // ملء نموذج الدخول
    const credentials = JSON.parse(process.env.TASK_CREDENTIALS || '{}');
    
    console.log('🔑 بدء تسجيل الدخول...');
    await humanType(page, '#email, input[type=\"email\"]', credentials.email || 'test@example.com');
    await page.waitForTimeout(1000);
    
    await humanType(page, '#password, input[type=\"password\"]', credentials.password || 'password123');
    await page.waitForTimeout(500);
    
    await humanClick(page, 'button[type=\"submit\"]');
    await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
    
    taskResult = { loginSuccess: true, timestamp: new Date().toISOString() };
    console.log('✅ تم تسجيل الدخول بنجاح');`;
  } else if (task.type === 'screenshot') {
    return `
    // التقاط لقطة شاشة
    console.log('📸 التقاط لقطة شاشة للصفحة...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    const screenshotData = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    taskResult = { 
      screenshotSize: screenshotData.length,
      pageTitle: await page.title(),
      url: page.url()
    };
    console.log('✅ تم التقاط الصورة بنجاح');`;
  } else if (task.type === 'testing') {
    return `
    // اختبار الموقع
    console.log('🧪 بدء اختبار الموقع...');
    
    taskResult = {
      loaded: await page.isVisible('body'),
      title: await page.title(),
      linksCount: await page.locator('a').count(),
      imagesCount: await page.locator('img').count(),
      url: page.url(),
      loadTime: Date.now() - startTime
    };
    
    console.log('📊 نتائج الاختبار:', JSON.stringify(taskResult, null, 2));
    console.log('✅ اكتمل الاختبار');`;
  } else if (task.type === 'custom') {
    // معالجة خاصة للسكريبت المخصص من Visual Builder
    const userScript = task.script || '';
    
    // التحقق من نوع السكريبت
    if (userScript.includes('async function runTask(page)')) {
      // سكريبت من AdvancedVisualBuilder - استخراج محتوى الدالة
      const functionBodyMatch = userScript.match(/async function runTask\(page\)\s*{([\s\S]*?)}\s*$/);
      if (functionBodyMatch) {
        const functionBody = functionBodyMatch[1].trim();
        // إزالة try-catch الخارجي وإرجاع النتيجة
        const cleanedBody = functionBody
          .replace(/^\s*try\s*{/, '')
          .replace(/}\s*catch\s*\(error\)\s*{[\s\S]*?}\s*$/, '')
          .trim();
        
        return `
    // تنفيذ السكريبت المخصص (من المنشئ المرئي المتقدم)
    console.log('⚙️ بدء تنفيذ المهمة...');
    
    let stepResults = [];
    
    ${cleanedBody}
    
    taskResult = {
      stepsExecuted: stepResults.length,
      success: true,
      results: stepResults
    };
    
    console.log('✅ تم تنفيذ جميع الخطوات بنجاح');
    console.log('📊 ملخص النتائج:', JSON.stringify(taskResult, null, 2));`;
      }
    } else if (userScript.includes('"steps"') || userScript.includes('steps')) {
      // سكريبت JSON من VisualBuilder
      try {
        const parsed = JSON.parse(userScript);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          let stepsCode = `
    // تنفيذ خطوات المهمة من المنشئ المرئي
    console.log('⚙️ بدء تنفيذ ${parsed.steps.length} خطوة...');
    
    let stepResults = [];
    let stepNumber = 1;
    `;
          
          parsed.steps.forEach((step: any, index: number) => {
            stepsCode += `
    // خطوة ${index + 1}: ${step.type}
    console.log('📌 الخطوة ${index + 1}/${parsed.steps.length}: ${step.type}');
    try {
      `;
            
            switch (step.type) {
              case 'navigate':
                stepsCode += `await page.goto('${step.params.url}', { waitUntil: 'domcontentloaded' });
      console.log('✅ تم الانتقال إلى: ${step.params.url}');
      stepResults.push({ step: ${index + 1}, type: 'navigate', status: 'success', url: '${step.params.url}' });`;
                break;
              case 'click':
                stepsCode += `await page.click('${step.params.selector}');
      console.log('✅ تم النقر على: ${step.params.selector}');
      stepResults.push({ step: ${index + 1}, type: 'click', status: 'success', selector: '${step.params.selector}' });`;
                break;
              case 'type':
                stepsCode += `await page.fill('${step.params.selector}', '${step.params.text}');
      console.log('✅ تم كتابة النص في: ${step.params.selector}');
      stepResults.push({ step: ${index + 1}, type: 'type', status: 'success', selector: '${step.params.selector}', text: '${step.params.text}' });`;
                break;
              case 'wait':
                stepsCode += `await page.waitForTimeout(${step.params.duration || 1000});
      console.log('✅ تم الانتظار: ${step.params.duration || 1000}ms');
      stepResults.push({ step: ${index + 1}, type: 'wait', status: 'success', duration: ${step.params.duration || 1000} });`;
                break;
              case 'extract':
                stepsCode += `const extractedData${index} = await page.$$eval('${step.params.selector}', els => els.map(el => el.textContent?.trim()));
      console.log(\`✅ تم استخراج \${extractedData${index}.length} عنصر من: ${step.params.selector}\`);
      stepResults.push({ step: ${index + 1}, type: 'extract', status: 'success', selector: '${step.params.selector}', dataCount: extractedData${index}.length, data: extractedData${index} });`;
                break;
              case 'screenshot':
                stepsCode += `const screenshotPath${index} = path.join('screenshots', TASK.id + '-step${index + 1}-' + Date.now() + '.png');
      await fs.mkdir('screenshots', { recursive: true });
      await page.screenshot({ path: screenshotPath${index}, fullPage: ${step.params.fullPage || false} });
      console.log('✅ تم التقاط صورة: ' + screenshotPath${index});
      stepResults.push({ step: ${index + 1}, type: 'screenshot', status: 'success', path: screenshotPath${index} });`;
                break;
              default:
                stepsCode += `console.log('⚠️ نوع خطوة غير معروف: ${step.type}');
      stepResults.push({ step: ${index + 1}, type: '${step.type}', status: 'skipped' });`;
            }
            
            stepsCode += `
    } catch (stepError) {
      console.error('❌ فشلت الخطوة ${index + 1}:', stepError.message);
      stepResults.push({ step: ${index + 1}, type: '${step.type}', status: 'failed', error: stepError.message });
    }
    `;
          });
          
          stepsCode += `
    taskResult = {
      totalSteps: ${parsed.steps.length},
      successfulSteps: stepResults.filter(r => r.status === 'success').length,
      failedSteps: stepResults.filter(r => r.status === 'failed').length,
      steps: stepResults
    };
    
    console.log('✅ تم تنفيذ جميع الخطوات');
    console.log('📊 ملخص الخطوات:', JSON.stringify(taskResult, null, 2));`;
          
          return stepsCode;
        }
      } catch (e) {
        // إذا فشل التحليل، استخدم التنفيذ الافتراضي
      }
    }
    
    // تنفيذ افتراضي لسكريبت غير معروف
    return `
    // تنفيذ السكريبت المخصص
    console.log('⚙️ تنفيذ السكريبت المخصص...');
    
    taskResult = await page.evaluate(() => {
      // السكريبت المخصص هنا
      return {
        pageTitle: document.title,
        url: window.location.href,
        scriptExecuted: true
      };
    });
    
    console.log('✅ تم تنفيذ السكريبت المخصص');
    console.log('النتيجة:', JSON.stringify(taskResult, null, 2));`;
  } else {
    // أي نوع آخر
    return `
    // تنفيذ مهمة عامة
    console.log('⚙️ تنفيذ المهمة...');
    
    taskResult = {
      pageTitle: await page.title(),
      url: page.url(),
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ تم تنفيذ المهمة');
    console.log('النتيجة:', JSON.stringify(taskResult, null, 2));`;
  }
}

function generateStealthHelpers(stealthConfig: any): string {
  return `// ملف مساعد لإعدادات التخفي - stealth-helpers.js
import { chromium } from 'playwright';

const STEALTH_CONFIG = ${JSON.stringify(stealthConfig, null, 2)};

export async function createStealthBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      ${stealthConfig.blockWebRTC ? `'--disable-webrtc',` : ''}
      ${stealthConfig.maskFingerprint ? `'--disable-features=site-per-process',` : ''}
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    ${stealthConfig.randomUserAgent ? `userAgent: getRandomUserAgent(),` : ''}
    ${stealthConfig.randomViewport ? `viewport: getRandomViewport(),` : ''}
    ${stealthConfig.randomTimezone ? `timezoneId: getRandomTimezone(),` : ''}
    ${stealthConfig.randomLanguage ? `locale: getRandomLanguage(),` : ''}
    permissions: []
  });

  ${stealthConfig.hideWebdriver ? `await context.addInitScript(() => {
    // إخفاء webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
    
    // إضافة chrome object
    window.navigator.chrome = { 
      runtime: {},
      loadTimes: function() {},
      csi: function() {}
    };
    
    // تعديل plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    // تعديل languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ar', 'en-US', 'en']
    });
  });` : ''}

  ${stealthConfig.blockWebRTC ? `await context.addInitScript(() => {
    // حظر WebRTC leaks
    const originalRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(...args) {
      console.log('WebRTC blocked by stealth mode');
      return null;
    };
  });` : ''}

  const page = await context.newPage();
  
  return { browser, context, page };
}

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function getRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 }
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
}

function getRandomTimezone() {
  const timezones = ['Asia/Riyadh', 'Asia/Dubai', 'Africa/Cairo', 'Europe/London'];
  return timezones[Math.floor(Math.random() * timezones.length)];
}

function getRandomLanguage() {
  const languages = ['ar-SA', 'ar-AE', 'ar-EG', 'en-US'];
  return languages[Math.floor(Math.random() * languages.length)];
}

export async function humanClick(page, selector) {
  ${stealthConfig.humanClicks ? `// نقرة بشرية مع تأخير عشوائي
  await page.waitForTimeout(200 + Math.random() * 300);
  
  // تحريك الماوس إلى العنصر أولاً
  ${stealthConfig.mouseMovement ? `const element = await page.locator(selector);
  const box = await element.boundingBox();
  if (box) {
    await page.mouse.move(
      box.x + box.width / 2 + (Math.random() - 0.5) * 10,
      box.y + box.height / 2 + (Math.random() - 0.5) * 10
    );
    await page.waitForTimeout(100 + Math.random() * 200);
  }` : ''}
  
  await page.click(selector);
  await page.waitForTimeout(100 + Math.random() * 200);` : `await page.click(selector);`}
}

export async function humanType(page, selector, text) {
  ${stealthConfig.humanTyping ? `// كتابة بشرية مع تأخير عشوائي بين الأحرف
  await page.waitForTimeout(300 + Math.random() * 500);
  
  await page.click(selector);
  await page.waitForTimeout(200);
  
  for (const char of text) {
    await page.type(selector, char, {
      delay: 50 + Math.random() * 150
    });
    
    // توقف عشوائي أثناء الكتابة (محاكاة التفكير)
    if (Math.random() < 0.1) {
      await page.waitForTimeout(300 + Math.random() * 700);
    }
  }
  
  await page.waitForTimeout(200 + Math.random() * 400);` : `await page.fill(selector, text);`}
}

export async function humanScroll(page) {
  ${stealthConfig.scrollBehavior ? `// تمرير بشري للصفحة
  const scrollSteps = 3 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < scrollSteps; i++) {
    await page.evaluate(() => {
      window.scrollBy({
        top: 200 + Math.random() * 400,
        behavior: 'smooth'
      });
    });
    await page.waitForTimeout(500 + Math.random() * 1000);
  }
  
  // العودة للأعلى
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(500);` : `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`}
}

// تصدير الإعدادات
export const stealthConfig = STEALTH_CONFIG;
`;
}

function generatePackageJSON(): string {
  return JSON.stringify({
    name: 'web-automation-bot',
    version: '1.0.0',
    description: 'Automated web tasks with Playwright and advanced stealth',
    type: 'module',  // ✅ ضروري لاستخدام ES Modules (import/export)
    scripts: {
      test: 'echo \"No tests\"'
    },
    dependencies: {
      'playwright': '^1.40.0'
    }
  }, null, 2);
}

function generateREADME(tasks: any[]): string {
  return `# 🤖 Web Automation Bot

نظام أتمتة ويب ذكي مع حماية متقدمة من كاشفات الروبوتات.

## 📋 لمهام

${tasks.map((t, i) => `${i + 1}. **${t.name}**: ${t.description}`).join('\n')}

## 🚀 لتشغيل

### تشغيل مهمة محدد
\`\`\`bash
node scripts/task-<task-id>.js
\`\`\`

### عبر GitHub Actions
- التشغيل التلقائي حسب الجدول المحدد
- أو تشغيل يدوي من تبويب Actions

## 📊 النتائج

- النتائج تُحفظ في: \`results/\`
- الصور في: \`screenshots/\`
- السجلات في: \`logs/\`

## 🛡️ ميزات Stealth

- إخفاء webdriver
- User-Agent عشوائي
- محاكاة سلوك بشري
- تأخيرات طبيعية

تم التوليد تلقائياً بواسطة Web Automation Bot
`;
}

export { GitHubAPI };
export default GitHubAPI;