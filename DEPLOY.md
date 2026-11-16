# 服务器部署与 HTTPS 证书维护

面向 `docs.easydetek.com` 的自建服务器（阿里云，`120.24.115.60`，Debian 13）。
**本文件描述的是线上真实架构**，2026-11 已按实际运行情况重写——旧版写的"Caddy 自动 HTTPS"从未落地，正是当年证书配错的源头。

---

## 一、架构（2026-11 现状）

```
用户 ──HTTPS──> 宿主机 Nginx（80/443，TLS 终结，Let's Encrypt 证书）
                    ├── /              → 127.0.0.1:8092   easydetek-site 容器（Docusaurus 静态站）
                    ├── /auth          → 127.0.0.1:8093   easydetek-oauth-proxy（CMS 登录）
                    └── /callback      → 127.0.0.1:8093
```

| 组件 | 位置 | 说明 |
|---|---|---|
| TLS 终结 | 宿主机 Nginx | 配置 `/etc/nginx/conf.d/docs.easydetek.com.conf`，基线见仓库 `nginx-server.conf` |
| 证书 | `/etc/letsencrypt/live/docs.easydetek.com/` | 由宿主机 certbot 申请与续签 |
| 站点 | `easydetek-site` 容器 | 只监听 `127.0.0.1:8092`，容器内不做 TLS |
| CMS 认证 | `easydetek-oauth-proxy` 容器 | 只监听 `127.0.0.1:8093` |

> 注意：`easydetek-caddy` 容器仍在运行，但不发布任何端口、不参与 HTTPS，是旧方案遗留。
> **不要**按旧文档去 Caddy 找证书——线上一律以宿主机 Nginx + certbot 为准。

---

## 二、日常部署

```bash
cd /home/easydetek/docs.easydetek.com
git pull origin main
docker compose up -d --build
```

Nginx 配置改动流程（改一处要同步两边）：

```bash
# 1. 改仓库里的 nginx-server.conf（线上基线，含约束注释）
# 2. 同步到服务器
sudo cp /path/to/nginx-server.conf /etc/nginx/conf.d/docs.easydetek.com.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## 三、证书自动续签（当前机制）

| 项 | 值 |
|---|---|
| 工具 | certbot 4.0.0（`/usr/bin/certbot`） |
| 校验方式 | **webroot**，校验目录 `/var/www/certbot` |
| 续签后钩子 | `renew_hook = systemctl reload nginx` |
| 触发者 | `certbot.timer`（systemd，每天两次） |
| 续签配置 | `/etc/letsencrypt/renewal/docs.easydetek.com.conf` |

常用命令：

```bash
sudo certbot certificates              # 看证书与剩余天数
sudo certbot renew --dry-run           # 演练整条续签链路（staging，不消耗正式额度）
sudo certbot renew                     # 手动续签（一般无需介入）
sudo tail -50 /var/log/letsencrypt/letsencrypt.log
```

**验证健康状态**（这两条都通过就说明自动续签不会翻车）：

```bash
# 1. 演练成功
sudo certbot renew --dry-run | tail -3        # 期望：all simulated renewals succeeded

# 2. ACME 校验路径未被重定向（期望 404，不是 301）
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: docs.easydetek.com' \
  http://127.0.0.1/.well-known/acme-challenge/probe
```

---

## 四、两条必须守住的约束（2026-11 证书过期事故根因）

### 约束 1：不要用 `authenticator = standalone`

`standalone` 模式下 certbot 要**独占 80 端口**做校验，而 80 端口被宿主机 Nginx 长期占用，于是每次续签都报：

```
Could not bind TCP port 80 because it is already in use by another process
```

关键是它**只写日志、不告警**：`certbot.timer` 每天照常运行、照常失败，直到证书过期才被发现。
本次事故即为此：2026-08-14 签发后一次都没续成，2026-11-12 过期，11-16 才被发现。

正确做法就是当前的 `webroot`：校验文件写到 `/var/www/certbot`，由 Nginx 直接托管，不争端口。

### 约束 2：80 端口区块里 `return 301` 必须放在 `location /` 内部

```nginx
# ✅ 正确：ACME location 能优先命中
server {
    listen 80;
    server_name docs.easydetek.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

# ❌ 错误：server 级 return 在 rewrite 阶段短路，ACME location 永不命中
server {
    listen 80;
    server_name docs.easydetek.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
    return 301 https://$host$request_uri;
}
```

错误写法下，Let's Encrypt 的校验请求会被 301 跳到 HTTPS，然后在 443 上拿到 404，报错形如：

```
Detail: 120.24.115.60: Invalid response from https://docs.easydetek.com/.well-known/acme-challenge/xxx: 404
```

注意报错里出现的是 **`https://`** —— 看到这个就该怀疑 301 抢在了 ACME 校验之前。

---

## 五、排障

| 现象 | 排查 |
|---|---|
| 浏览器显示"不安全" | 先 `sudo certbot certificates` 看是否过期；未过期多半是标签页缓存，`Ctrl+Shift+R` |
| 续签报端口占用 | 续签方式被改回 standalone，检查 renewal conf 的 `authenticator` |
| 续签报 unauthorized / 404 | 约束 2 被破坏，或 `/var/www/certbot` 权限/归属不对 |
| 改完配置探测仍是旧行为 | `reload` 后旧 worker 会短暂滞留，`sleep 2` 再探测；必要时 `sudo nginx -T` 看合并后的配置 |
| 需要回滚配置 | `sudo cp /etc/nginx/conf.d/docs.easydetek.com.conf.bak-<时间戳> /etc/nginx/conf.d/docs.easydetek.com.conf && sudo nginx -t && sudo systemctl reload nginx` |

Let's Encrypt 额度提示：单域名**验证失败**限 **5 次/小时**。排障时优先用 `curl` 本地探测确认
ACME 路径可用，再让 certbot 真正去请求，不要盲目重跑。

---

## 六、部署链路提醒

| 目标 | 方式 |
|---|---|
| `easydetek.github.io` | push 到 `origin` 后 GitHub Actions 自动构建发布（约 2–4 分钟） |
| `docs.easydetek.com` | 自建服务器，**手动**：`git pull origin main && docker compose up -d --build` |

推送完成 ≠ 线上更新，这两条是不同链路，交付时要分别确认（详见仓库根 `AGENTS.md` §6）。
