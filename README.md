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

### 方式 A：GitHub Actions 自动部署（推荐）

1. 在 GitHub 创建仓库（建议组织仓库，名为 `<org>.github.io`，例如 `easydetek.github.io`）。
2. 把本项目推送到仓库 `main` 分支：
   ```bash
   git init
   git add .
   git commit -m "init easydetek site"
   git branch -M main
   git remote add origin https://github.com/<org>/<repo>.git
   git push -u origin main
   ```
3. 修改 `docusaurus.config.ts` 顶部的三个变量为你的真实信息：
   ```ts
   const ORGANIZATION_NAME = '<org>';        // GitHub 组织/用户名
   const PROJECT_NAME = '<repo>';           // 仓库名
   const SITE_URL = `https://<org>.github.io`;
   ```
4. 在仓库 **Settings → Pages**：
   - **Source** 选择 `GitHub Actions`。
5. 推送后 `.github/workflows/deploy.yml` 会自动构建中英文并发布。
   访问地址：`https://<org>.github.io/`

> 若仓库不是 `<org>.github.io` 格式（例如叫 `docs`），`baseUrl` 会自动设为 `/docs/`，访问地址变为 `https://<org>.github.io/docs/`。

### 方式 B：自定义域名（可选）

在仓库 **Settings → Pages → Custom domain** 填入域名（如 `docs.easydetek.com`），并把 `docusaurus.config.ts` 的 `url` 改为该域名。

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

Docusaurus 3 · React 19 · TypeScript · Infima CSS · GitHub Actions
