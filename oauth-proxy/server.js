/**
 * Decap CMS OAuth 代理服务（零依赖，纯 Node.js 内置模块）
 *
 * OAuth 流程：
 *   1. CMS 弹窗打开 /auth → 代理重定向到 GitHub/Gitee 授权页
 *   2. 用户授权后，GitHub/Gitee 回调到【代理的 /callback 端点】
 *      （GitHub OAuth App 注册的回调地址必须是: {ORIGIN}/callback）
 *   3. 代理用 code 换 access_token
 *   4. 代理重定向回 CMS: {ORIGIN}/admin/#/callback?access_token=xxx&provider=github
 *   5. CMS 弹窗拿到 token，完成登录
 *
 * 环境变量：
 *   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
 *   GITEE_CLIENT_ID / GITEE_CLIENT_SECRET
 *   ORIGIN - 站点地址（如 https://docs.easydetek.com）
 *   PORT   - 监听端口（默认 8081）
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 8081;
const ORIGIN = process.env.ORIGIN || 'http://localhost';

// 代理自身的回调端点（GitHub/Gitee OAuth 应用里注册的回调地址必须是这个）
const PROXY_CALLBACK = `${ORIGIN}/callback`;

const GITHUB = {
  id: process.env.GITHUB_CLIENT_ID,
  secret: process.env.GITHUB_CLIENT_SECRET,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scope: 'repo,user',
};

const GITEE = {
  id: process.env.GITEE_CLIENT_ID,
  secret: process.env.GITEE_CLIENT_SECRET,
  authUrl: 'https://gitee.com/oauth/authorize',
  tokenUrl: 'https://gitee.com/oauth/token',
  scope: 'projects',
};

function jsonRes(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function httpsPost(postUrl, body) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const u = new URL(postUrl);
    const postData = new URLSearchParams(body).toString();
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (path === '/' || path === '/health') {
    return jsonRes(res, 200, { ok: true, service: 'decap-cms-oauth-proxy' });
  }

  // ---- 认证入口：CMS 打开 /auth?provider=github|gitee ----
  if (path === '/auth') {
    const provider = (parsed.query.provider || 'github').toLowerCase();
    const cfg = provider === 'gitee' ? GITEE : GITHUB;

    if (!cfg.id || !cfg.secret) {
      return jsonRes(res, 500, { error: `${provider} OAuth 未配置（检查 .env）` });
    }

    const state = crypto.randomBytes(8).toString('hex');
    const params = new URLSearchParams({
      client_id: cfg.id,
      // 关键：回调必须指向代理自己的 /callback 端点，
      // 与 GitHub/Gitee OAuth 应用注册的回调地址完全一致
      redirect_uri: PROXY_CALLBACK,
      scope: cfg.scope,
      state,
      response_type: 'code',
    });
    console.log(`[auth] provider=${provider} → 授权页`);
    return redirect(res, `${cfg.authUrl}?${params}`);
  }

  // ---- 授权回调：GitHub/Gitee 带着 code 回到这里 ----
  if (path === '/callback') {
    const code = parsed.query.code;
    const error = parsed.query.error;
    const provider = (parsed.query.provider || 'github').toLowerCase();
    const cfg = provider === 'gitee' ? GITEE : GITHUB;

    if (error) {
      console.log(`[callback] 授权失败: ${error}`);
      return jsonRes(res, 400, { error: parsed.query.error_description || error });
    }
    if (!code) {
      return jsonRes(res, 400, { error: '缺少 code 参数' });
    }

    try {
      const tokenRes = await httpsPost(cfg.tokenUrl, {
        client_id: cfg.id,
        client_secret: cfg.secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: PROXY_CALLBACK,
      });

      const token = tokenRes.access_token;
      if (token) {
        console.log(`[callback] ${provider} token 换取成功`);
        // 回传给 CMS（Decap 约定的 hash 格式）
        return redirect(
          res,
          `${ORIGIN}/admin/#/callback?access_token=${token}&provider=${provider === 'gitee' ? 'github' : 'github'}`
        );
      }
      console.log(`[callback] token 换取失败:`, JSON.stringify(tokenRes).slice(0, 300));
      return jsonRes(res, 400, { error: 'token 换取失败', detail: tokenRes });
    } catch (e) {
      console.log(`[callback] 异常:`, e.message);
      return jsonRes(res, 500, { error: e.message });
    }
  }

  jsonRes(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`✅ OAuth proxy running on :${PORT}`);
  console.log(`   ORIGIN:         ${ORIGIN}`);
  console.log(`   PROXY_CALLBACK: ${PROXY_CALLBACK}  ← OAuth 应用注册的回调地址必须是这个`);
  console.log(`   GitHub: ${GITHUB.id ? 'configured' : 'NOT set'}`);
  console.log(`   Gitee:  ${GITEE.id ? 'configured' : 'NOT set'}`);
});
