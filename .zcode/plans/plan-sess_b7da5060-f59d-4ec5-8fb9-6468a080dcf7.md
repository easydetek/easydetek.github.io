# EasyDetek 站点：借鉴 ESP-IDF 功能实施计划

基于 Docusaurus 3.10.2 现有站点，实现 4 个功能。按"低风险→需定制"排序，分 4 个阶段执行。

---

## 阶段 1️⃣ 文档版本化能力（原生，最简单）

**目标**：配置版本化能力 + 导航栏版本下拉，但不真正发版（等固件发布时再 `docs:version`）。

**改动**：
1. `docusaurus.config.ts` 的 `docs` 配置块加版本化选项：
   - `includeCurrentVersion: true`
   - `lastVersion: 'current'`
   - `versions: { current: { label: '最新', banner: 'unreleased' } }`
2. `navbar.items` 在 `localeDropdown` 前插入：
   - `{ type: 'docsVersionDropdown', position: 'right', dropdownActiveClassDisabled: true }`

**效果**：导航栏出现版本下拉，当前只有"最新"一个版本。未来固件发布时跑 `npx docusaurus docs:version 1.0.0` 即可锁定历史版本。

---

## 阶段 2️⃣ 文档反馈按钮（swizzle + 邮件）

**目标**：每篇文档底部显示"此文档对您有帮助吗？👍 👎"，点击后打开预填邮件。

**改动**：
1. 执行 `npx docusaurus swizzle @docusaurus/theme-classic DocItem/Footer --eject`
   - 生成 `src/theme/DocItem/Footer/index.tsx`
2. 在该组件内追加反馈区块 JSX：
   - 用 `useDoc()` 取 `metadata.title` 和 `metadata.permalink` 作邮件正文标识
   - 两个按钮"有用 👍"/"无用 👎"，点击跳转 `mailto:support@easydetek.com?subject=文档反馈&body=...`
3. 新建 `src/theme/DocItem/Footer/styles.module.css` 样式文件
4. 关键：反馈区块放在 `canDisplayFooter` 判断之外，确保每篇文档都显示（即使无 tag/edit 信息）

---

## 阶段 3️⃣ 产品型号分类页（产品手册页内 Tabs）

**目标**：产品手册分类页内按产品线分标签页（EDV 微波传感器 / EDQ 成品传感器 / EDC 嵌入模组），类似 ESP-IDF 按芯片分类。

**改动**：
1. 新建 `docs/产品手册/index.md` —— 使用 MDX 的 `<Tabs>`/`<TabItem>` 组件按产品线分页：
   - Tab 1「微波传感器」：EDV531、EDV532
   - Tab 2「成品传感器」：EDQ55G/H、EDQ25S-K
   - Tab 3「嵌入模组」：EDC116、EDC189C
   - 每个 Tab 内用卡片链接到对应型号文档页
2. 调整 `docs/产品手册/_category_.json`，让分类落地页指向这个 index
3. 不改动现有各型号文档页（保持独立可访问）

**效果**：进入"产品手册"看到按产品线分类的卡片入口，点击进入具体型号。

---

## 阶段 4️⃣ PWA 离线访问（plugin）

**目标**：用户访问站点后自动缓存，断网仍可浏览。

**改动**：
1. `npm install docusaurus-plugin-offline`
2. `docusaurus.config.ts` 新增顶层 `plugins: ['docusaurus-plugin-offline']`
3. 构建验证（PWA 需 HTTPS 才生效，本地 http 仅测试不报错即可）

> 注：PWA 的 service worker 仅在生产环境（HTTPS 或 localhost）生效。服务器部署后通过 Caddy 的 HTTPS 即可正常工作。

---

## 验证 & 收尾

每个阶段完成后：
1. `npm run build` 确认构建通过
2. Docker 重建 `docker compose -f docker-compose.local.yml up -d --build`
3. `curl` 验证关键页面 HTTP 200
4. 全部完成后统一 git commit（一个阶段一个 commit，便于回溯）

## 不做的事（明确边界）

- ❌ 不换技术栈（保留 Docusaurus，不转 Sphinx）
- ❌ 不做全局型号筛选下拉（改为产品页内分类，更轻量）
- ❌ 不接 GA/自建反馈接口（用邮件，零后端）
- ❌ 不现在发版（只配能力，固件发布时再 `docs:version`）
- ❌ 不做 ZIP 整站下载（PWA 已覆盖离线需求）