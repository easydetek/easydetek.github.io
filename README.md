# EasyDetek 官方技术站点

基于 [Docusaurus 3](https://docusaurus.io/) 构建，中英双语，自动部署到 GitHub Pages。

包含：**产品文档** · **开发对接** · **应用案例** · **开源项目**。

---

## 一、本地开发

依赖：Node.js ≥ 20（推荐 20 LTS）

```bash
npm install          # 安装依赖
npm run start        # 启动开发服务器（默认中文，热更新）
npm run start -- --locale en   # 启动英文版预览
```

## 二、构建与预览

```bash
npm run build        # 构建中英文到 build/
npm run serve        # 本地预览构建产物
```

## 三、目录结构速查

```
docs/                    产品文档（中文，权威源）
  ├─ 快速开始/           入门与产品体系总览
  ├─ 产品手册/           各型号规格（EDV532、EDQ55G/H、EDC116/189C、EDQ25S-K）
  └─ 开发对接/           通信协议、串口示例、KNX、集群组网
blog/                    应用案例库
src/pages/               首页、开源项目页
src/components/          首页特性卡片
static/img/              Logo、favicon、社交分享卡
i18n/en/                 英文翻译（UI + 文档）
.github/workflows/       GitHub Actions 自动部署
docusaurus.config.ts     站点总配置（品牌、导航、双语、部署）
sidebars.ts              侧边栏（自动生成）
```

---

## 四、如何新增一篇产品文档？

1. 在 `docs/产品手册/` 新建 `.md` 文件，例如 `edv999.md`。
2. 文件开头加 frontmatter：
   ```markdown
   ---
   sidebar_position: 5
   ---
   # EDV999 产品名称
   ```
3. 侧边栏会**自动**收录（按 `sidebar_position` 排序），无需改任何配置。

## 五、如何新增一篇应用案例？

1. 在 `blog/` 新建文件，命名格式 `YYYY-MM-DD-标题.md`。
2. frontmatter 示例：
   ```markdown
   ---
   slug: my-case
   title: 案例标题
   authors: [easydetek]
   tags: [lighting, smarthome]
   ---
   ```
3. 正文开头一段作为摘要，紧接 `<!-- truncate -->`，之后为正文。

## 六、如何翻译成英文？

UI 文案：编辑 `i18n/en/code.json`、`navbar.json`、`footer.json` 中对应条目的 `message`。

文档内容：在 `i18n/en/docusaurus-plugin-content-docs/current/` 下创建同名 `.md` 文件（结构与中文 `docs/` 一致）。

新增翻译条目后可重新生成模板：
```bash
npm run write-translations -- --locale en
```

## 七、部署上线

### 方式 A：Docker 自部署（✅ 当前方案 / 推荐）

适合自有服务器，完全自主可控、访问快、不依赖第三方平台。

#### 前提
服务器已安装 Docker（≥ 20）与 Docker Compose（v2）。

#### 一键启动
```bash
# 在项目根目录
docker compose up -d --build
```
启动后访问：**http://服务器IP/**

#### 常用命令
```bash
docker compose up -d --build   # 构建并启动（后台）
docker compose down            # 停止并移除容器
docker compose restart         # 重启
docker compose logs -f         # 查看实时日志
```

#### 指定正式域名
编辑 `docker-compose.yml`，把 `SITE_URL` 改为正式域名（影响 sitemap、社交分享卡片）：
```yaml
build:
  context: .
  args:
    SITE_URL: https://docs.easydetek.com
```
重新构建生效：`docker compose up -d --build`

#### 端口调整
默认占用宿主机 80 端口。如需改用其他端口（如 8080），改 `docker-compose.yml`：
```yaml
ports:
  - "8080:80"
```

#### 更新站点内容
改完文档后，重新构建即可：
```bash
docker compose up -d --build
```
（nginx 已对 HTML 设置 `no-cache`，更新即时生效；静态资源带 hash 长缓存。）

#### 反向代理 / HTTPS（可选）
生产环境建议在前面加一层 Nginx 或 Caddy 做反向代理 + HTTPS：
```nginx
# 外层 Nginx 示例
server {
    listen 443 ssl http2;
    server_name docs.easydetek.com;
    # ssl 证书配置 ...
    location / {
        proxy_pass http://127.0.0.1:80;   # 指向容器映射端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 部署架构
```
用户 → [Nginx/Caddy + HTTPS] → Docker 容器(nginx:80) → 静态文件
```

---

### 方式 B：GitHub Pages（备选）

若仍需 GitHub Pages 托管（代码已在 `easydetek/easydetek.github.io`）：

1. 仓库 **Settings → Pages → Source** 选 `GitHub Actions`。
2. 推送 main 分支，`.github/workflows/deploy.yml` 自动构建中英文并发布。
3. 访问：`https://easydetek.github.io/`

> 自定义域名：在 Pages 设置填入域名，并取消 `docusaurus.config.ts` 中 `SITE_URL` 的环境变量覆盖（直接写死域名）。

---

## 八、需要补充的真实资料（占位待填）

文档中标记「待补充」的字段，需要团队提供后替换：

- [ ] 各产品完整规格参数表（电压、距离、功耗、尺寸、防护等级）
- [ ] 引脚定义、安装说明、认证信息
- [ ] 串口 / KNX / PLC 通信协议详细文档
- [ ] 真实 Logo / 产品图片（替换 `static/img/` 下的占位 SVG）
- [ ] 开源仓库真实地址与说明（编辑 `src/pages/open-source.tsx`）

---

## 技术栈

Docusaurus 3 · React 19 · TypeScript · Infima CSS · Docker · nginx
