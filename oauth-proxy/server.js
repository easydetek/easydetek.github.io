/**
 * Decap CMS OAuth 代理服务（零依赖，纯 Node.js 内置模块）
 *
 * 功能：为 Decap CMS 提供 GitHub/Gitee OAuth token 交换代理
 * 原理：CMS 前端 → 本代理 /auth → 重定向到 GitHub/Gitee 授权页
 *       GitHub/Gitee 回调 → 本代理 /callback → 换 token → 回传给 CMS
 *
 * 环境变量：
 *   GITHUB_CLIENT_ID     - GitHub OAuth App Client ID
 *   GITHUB_CLIENT_SECRET - GitHub OAuth App Client Secret
 *   GITEE_CLIENT_ID      - Gitee OAuth App Client ID
 *   GITEE_CLIENT_SECRET  - Gitee OAuth App Client Secret
 *   ORIGIN               - 站点地址（如 https://docs.easydetek.com）
 *   PORT                 - 监听端口（默认 8081）
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 8081;
const ORIGIN = process.env.ORIGIN || 'http://localhost';

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

// 简单的 JSON 响应
function jsonRes(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// 重定向
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

// POST 请求（token 交换）
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

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // 健康检查
  if (path === '/' || path === '/health') {
    return jsonRes(res, 200, { ok: true, service: 'decap-cms-oauth-proxy' });
  }

  // GitHub 认证入口
  if (path === '/auth') {
    const state = crypto.randomBytes(8).toString('hex');
    const provider = parsed.query.provider || 'github';
    const cfg = provider === 'gitee' ? GITEE : GITHUB;
    if (!cfg.id) return jsonRes(res, 500, { error: `${provider} OAuth not configured` });

    const params = new URLSearchParams({
      client_id: cfg.id,
      redirect_uri: `${ORIGIN}/admin/#/callback`,  // Decap CMS 回调
      scope: cfg.scope,
      state,
      response_type: 'code',
    });
    return redirect(res, `${cfg.authUrl}?${params}`);
  }

  // Token 交换回调
  if (path === '/callback') {
    const code = parsed.query.code;
    const provider = parsed.query.provider || 'github';
    const cfg = provider === 'gitee' ? GITEE : GITHUB;

    if (!code) return jsonRes(res, 400, { error: 'missing code' });

    try {
      const tokenRes = await httpsPost(cfg.tokenUrl, {
        client_id: cfg.id,
        client_secret: cfg.secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${ORIGIN}/admin/#/callback`,
      });

      const token = tokenRes.access_token;
      if (token) {
        // 重定向回 CMS，带 token
        return redirect(res, `${ORIGIN}/admin/#/callback?access_token=${token}`);
      }
      return jsonRes(res, 400, { error: 'token exchange failed', detail: tokenRes });
    } catch (e) {
      return jsonRes(res, 500, { error: e.message });
    }
  }

  jsonRes(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`✅ OAuth proxy running on :${PORT}`);
  console.log(`   Origin: ${ORIGIN}`);
  console.log(`   GitHub: ${GITHUB.id ? 'configured' : 'NOT set'}`);
  console.log(`   Gitee:  ${GITEE.id ? 'configured' : 'NOT set'}`);
});
