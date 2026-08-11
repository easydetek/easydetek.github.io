# 服务器部署指南（Docker + Caddy 自动 HTTPS）

本指南将站点部署到 Linux 服务器，自动获得 HTTPS（Let's Encrypt 免费证书，自动续期）。

---

## 一、架构

```
用户 ──HTTPS──> Caddy (容器, 80/443, 自动证书)
                    │
                    └──反代──> nginx (easydetek-site 容器, 80, 静态文件)
```

- **Caddy** 负责 HTTPS 证书申请、自动续期、反向代理、安全头
- **nginx** 负责托管 Docusaurus 构建的静态站

---

## 二、前提检查（你已确认）

- [x] 域名 `docs.easydetek.com` 已解析到服务器公网 IP
- [x] 服务器防火墙/安全组已放行 80 和 443 端口
- [x] 域名已完成备案（中国大陆服务器要求）

> ⚠️ 重要：Caddy 申请证书时会用 80 端口做校验，**80 端口必须可公网访问**，否则证书申请会失败。

---

## 三、服务器端操作

### 1. 安装 Docker（如未安装）

```bash
# 一键安装 Docker + Compose（官方脚本）
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

验证：
```bash
docker --version
docker compose version
```

### 2. 拉取代码

```bash
# 方式 A：从 GitHub 拉取
git clone https://github.com/easydetek/easydetek.github.io.git
cd easydetek.github.io

# 方式 B：从 Gitee 拉取（国内更快）
git clone https://gitee.com/easydetek/easydetek.gitee.io.git
cd easydetek.gitee.io
```

### 3. 确认域名配置

打开 `Caddyfile`，确认第一行的域名是你的真实域名（默认已填好）：
```
docs.easydetek.com {
```

打开 `docker-compose.yml`，确认 `SITE_URL` 是正式域名（默认已填好）：
```yaml
args:
  SITE_URL: https://docs.easydetek.com
```

> 如需改域名，改这两处即可。

### 4. 启动

```bash
docker compose up -d --build
```

首次启动会：
1. 构建 easydetek-site 镜像（约 2-3 分钟）
2. 启动 Caddy
3. **Caddy 自动向 Let's Encrypt 申请证书**（约 10-30 秒）

### 5. 验证

```bash
# 查看容器状态（两个都应是 Up）
docker compose ps

# 看 Caddy 日志，确认证书申请成功
docker compose logs caddy | grep -i "certificate\|obtained"
```

看到类似 `certificate obtained successfully` 就说明 HTTPS 已就绪。

浏览器访问：**https://docs.easydetek.com** 🔒

---

## 四、日常维护

| 操作 | 命令 |
|------|------|
| 更新站点内容（改完文档后） | `git pull && docker compose up -d --build` |
| 查看实时日志 | `docker compose logs -f` |
| 仅看 Caddy 日志 | `docker compose logs -f caddy` |
| 重启 | `docker compose restart` |
| 停止 | `docker compose down` |

证书会在到期前自动续期，**无需任何手动操作**。

---

## 五、常见问题

### Q: 证书申请失败怎么办？
检查：
1. 服务器 80 端口能否被公网访问（`curl http://服务器IP` 在外部测试）
2. 域名是否真的解析到了当前服务器（`ping docs.easydetek.com`）
3. 看 Caddy 日志：`docker compose logs caddy`

### Q: 80 端口被占用怎么办？
如果服务器已有其他程序用 80，改 `docker-compose.yml` 的端口映射，例如：
```yaml
ports:
  - "8080:80"
  - "8443:443"
```
但这样 Caddy 无法用 80 校验证书，建议让 Caddy 独占 80/443。

### Q: 想加多个域名怎么办？
在 `Caddyfile` 加多个块：
```
docs.easydetek.com, www.easydetek.com {
    reverse_proxy easydetek-site:80
}
```

### Q: 本地开发预览（不需要 HTTPS）怎么办？
用 `docker-compose.override.yml`（本地专用，不影响服务器），或直接：
```bash
docker compose -f docker-compose.local.yml up -d --build
```
（可按需创建一个本地版 compose 只跑 nginx 容器，暴露 80 端口）
