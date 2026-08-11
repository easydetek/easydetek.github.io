# 文档系统重构计划：按产品线拆分多 docs 实例

## 架构设计

将当前单 docs 实例（`/docs`）拆分为 **5 个独立 docs 实例**，每个独立版本化、独立维护：

| 实例 id | routeBasePath | 内容 | 版本化 |
|---------|--------------|------|--------|
| `default` | `/docs` | 通用文档（快速开始、产品总览） | ✅ 独立 |
| `modules` | `/modules` | **模组**产品线（EDC116/EDC189C + 对应开发对接） | ✅ 独立 |
| `sensors` | `/sensors` | **独立传感器**产品线（EDV532/EDQ55G/H/EDQ25S-K + 对应开发对接） | ✅ 独立 |
| `accessories` | `/accessories` | **配件**产品线（空框架，待填） | ✅ 独立 |
| `opensource` | `/opensource` | **开源生态**产品线（空框架，待填） | ✅ 独立 |

导航栏布局：
```
[Logo] | 通用文档 | 模组 | 独立传感器 | 配件 | 开源生态 | 应用案例 | ... | [版本下拉] [语言] [GitHub]
                                                                ↑ 当前产品线的独立版本下拉
```

## 实施步骤

### 阶段 1：新建产品线目录结构与内容迁移

创建 4 个新内容目录，把现有产品文档拆分迁移进去（开发对接也按产品线拆入）：

- `modules_docs/` —— EDC116/EDC189C + 模组相关开发对接
- `sensors_docs/` —— EDV532/EDQ55G/EDQ55H/EDQ25S-K + 传感器相关开发对接
- `accessories_docs/` —— 空框架（intro + _category_）
- `opensource_docs/` —— 空框架（intro + _category_）
- `docs/` 保留 —— 只留通用文档（快速开始 + 产品总览），删除产品手册和开发对接

每个新目录包含独立的 `_category_.json` 和 frontmatter 规范，**团队未来新增产品只需在该目录加 .md 文件**。

### 阶段 2：创建独立 sidebar 文件

- `sidebars.ts`（已有，保留，通用文档用）
- `sidebars.modules.ts`（新建）
- `sidebars.sensors.ts`（新建）
- `sidebars.accessories.ts`（新建）
- `sidebars.opensource.ts`（新建）

### 阶段 3：配置 docusaurus.config.ts

- `presets` 的 docs 块保持为默认实例（通用文档）
- 新增顶层 `plugins` 数组，声明 4 个 `@docusaurus/plugin-content-docs` 实例（modules/sensors/accessories/opensource）
- `navbar.items` 调整：每个产品线一个 `docSidebar` 入口（带 `docsPluginId`），版本下拉用**自定义组件**显示当前激活产品线的版本（或先每个产品线一个下拉）
- `footer` 链接更新指向新路径

### 阶段 4：修复所有跨实例链接

当前文档内有绝对路径 `/docs/产品手册/xxx`、`/docs/开发对接/xxx` 等链接，拆分后会失效。需要全部更新为新的实例路径（如 `/modules/edc116`、`/sensors/edv532`）。

受影响文件：intro.md、各产品文档、快速开始文档，以及它们的英文翻译。

### 阶段 5：清理旧版本快照 + 为每个产品线发版 v1.0.0

- 删除旧的全局 `versioned_docs/version-1.0.0/`、`versioned_sidebars/`、`versions.json`（重构后失效）
- 对每个产品线执行 `npx docusaurus docs:version:modules 1.0.0` 等命令，创建各自的 v1.0.0 快照
- 默认实例（通用文档）执行 `npx docusaurus docs:version 1.0.0`

### 阶段 6：更新 i18n

运行 `npx docusaurus write-translations` 重新生成各实例的翻译骨架，更新英文翻译路径。

### 阶段 7：构建验证 + Docker 重建 + 提交

每个阶段后构建验证，最终 Docker 重建并提交。

## 团队工作流（重构后）

产品经理/管理员新增一个产品型号的完整流程：

```bash
# 1. 在对应产品线目录新建 Markdown
echo '---
sidebar_position: 5
---
# EDV999 新产品
...' > sensors_docs/edv999.md

# 2. 提交
git add . && git commit -m "docs: 新增 EDV999"

# 3. 重建部署
docker compose up -d --build
```

发版（锁定历史版本）：
```bash
npx docusaurus docs:version:sensors 2.0.0
```

## 不做的事

- ❌ 不加 CMS 后台（保持 Git+Markdown 工作流）
- ❌ 不换技术栈（保持 Docusaurus）
- ❌ 配件/开源生态只建空框架，内容由团队后续填写