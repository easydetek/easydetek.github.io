# 缺陷修复记录：英文站版本下拉显示两个「Next」、缺失 1.0.0

- **修复日期**：2026-10-08
- **提交**：`9434f53` — fix(i18n): 修复英文站版本下拉显示两个 Next、缺失 1.0.0
- **影响范围**：英文站 `modules` / `sensors` / `accessories` / `opensource` / `docs`(默认) 五个 docs 实例
- **严重级别**：P1（用户可见的导航缺陷，影响英文读者定位「正式版 vs 开发版」文档）

---

## 1. 现象

英文模式下（EN），任意产品线页面的版本下拉显示两个同名条目，且看不到 `1.0.0`：

| 实例 | 修复前下拉项 | 修复后下拉项 |
| --- | --- | --- |
| modules | `Next（开发版）` / `Next（开发版）` | `Next` / `1.0.0` |
| sensors | `Next` / `Next` | `Next` / `1.0.0` |
| accessories | `Next（开发版）` / `Next（开发版）` | `Next` / `1.0.0` |
| opensource | `Next（开发版）` / `Next（开发版）` | `Next` / `1.0.0` |

中文站同一页面显示正常（`Next` / `1.0.0`），因此该缺陷**仅出现在英文站**。

## 2. 根因

Docusaurus 在非默认 locale 下，会用该 docs 实例的 i18n 文件覆盖版本元数据：

```
i18n/<locale>/docusaurus-plugin-content-docs-<instanceId>/current.json           → 覆盖 current（开发版）标签
i18n/<locale>/docusaurus-plugin-content-docs-<instanceId>/version-<ver>.json     → 覆盖该正式版本标签
```

其中 `version.label` 这个键的语义是**当前版本自己的显示名**（等价于 `versions.json` 里的版本字符串，并通过 `versionName` 生效）。

这些 `version-1.0.0.json` 显然是从对应的 `current.json` 复制而来，`version.label` 忘记修改，于是 `1.0.0` 被重命名为 `Next`（或 `Next（开发版）`），与真正的 current 撞名 → 下拉出现两个同名条目，`1.0.0` 消失。

**证据链**：

1. 英文构建产物 `build/en/modules/10.5GHz/edx106/index.html` 中，下拉渲染为两个 `Next（开发版）`；而同一页面 meta 为 `docusaurus_version=1.0.0`、`docusaurus_tag=docs-modules-1.0.0` → 版本本身存在且被识别，**只是显示名被 i18n 覆盖**。
2. 中文构建产物 `build/modules/10.5GHz/edx106/index.html` 显示 `Next` / `1.0.0` → `i18n/` 下无 `zh-Hans` 目录，无覆盖，走磁盘版本号，故正常。

## 3. 修复内容（9 个文件，均为 i18n 配置）

**A. `version-1.0.0.json`：`version.label` 改回版本号（5 个实例）**

| 文件 | 原值 | 新值 |
| --- | --- | --- |
| `i18n/en/docusaurus-plugin-content-docs/version-1.0.0.json` | `Next` | `1.0.0` |
| `i18n/en/docusaurus-plugin-content-docs-modules/version-1.0.0.json` | `Next（开发版）` | `1.0.0` |
| `i18n/en/docusaurus-plugin-content-docs-sensors/version-1.0.0.json` | `Next` | `1.0.0` |
| `i18n/en/docusaurus-plugin-content-docs-accessories/version-1.0.0.json` | `Next（开发版）` | `1.0.0` |
| `i18n/en/docusaurus-plugin-content-docs-opensource/version-1.0.0.json` | `Next（开发版）` | `1.0.0` |

同时把 `description` 从 `The label for version current` 修正为 `The label for version 1.0.0`，避免后续翻译工具误判。

**B. `current.json`：`version.label` 统一为 `Next`（4 个实例）**

`modules` / `accessories` / `opensource` / `newproducts` 原值为 `Next（开发版）`，改为 `Next`，去掉英文站里的中文后缀。`docs` / `sensors` 原本已是 `Next`，无需改动。

## 4. 验证

**CI 构建**：GitHub Actions `Deploy to GitHub Pages` — **success**（Node 20 + `npm ci` + `npm run build`，含中英双语构建；构建过程无报错，说明 i18n JSON 结构合法）。

**线上产物核验**（直接抓取部署后 HTML，解析 `dropdown__link`）：

| 页面 | 结果 |
| --- | --- |
| `en/modules/10.5GHz/edx106/` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/sensors/intro` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/accessories/intro` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/opensource/intro` | `Next` / `1.0.0` / `简体中文` / `English` |
| `modules/10.5GHz/edx106/`（中文站回归） | `Next` / `1.0.0` / `简体中文` / `English` |

结论：英文站与中文站行为已完全一致。

## 5. 复盘与预防

**为什么会发生**：`i18n/<locale>/.../version-<ver>.json` 是人工/工具复制 `current.json` 的产物，`version.label` 是容易被顺带复制错的键——它对「current」是 `Next`，对正式版本则必须是版本号，语义相反。

**预防措施（建议）**：

1. **发布新版本时的自检项**：执行 `docusaurus docs:version` 后，检查每个实例的 `i18n/<locale>/.../version-<新版本>.json`，`version.label` 必须是新版本号本身。
2. **回归检查点**：每次版本发布后，用英文模式打开 4 个产品线页面，确认版本下拉为两项且名称不同。
3. **可选自动化**：在 CI 增加一条校验——遍历 `i18n/*/docusaurus-plugin-content-docs*/version-*.json`，断言 `version.label.message` 等于目录名中的版本号（`version-1.0.0.json` → `1.0.0`）。可挂在 `deploy.yml` 的 build 之前作为前置检查。

**衍生发现（未处理）**：`newproducts` 实例在英文站没有 `version-1.0.0.json`，相应地该产品线在英文站没有版本化文档。若后续要对 `newproducts` 做版本冻结，需同步补齐该文件。

## 6. 环境备注

本次修复期间发现本机**未安装 Node.js**（`node` / `npm` / `npx` 均不在 PATH，`where.exe node` 无结果，WSL 内亦无 Node，且无 Docker）。构建验证先由 GitHub Actions 承担并通过；随后为支持本地确认，另行搭建了本地构建能力（见第 7 节）。

> 自托管部署（`docs.easydetek.com`，见 `docker-compose.yml` / `Caddyfile`）需重新构建镜像才能生效，与 GitHub Pages 的自动部署相互独立。
>
> 另：`Sync to Gitee` 工作流在本次推送中失败，与本修复无关，待单独排查。

---

## 7. 本地构建环境还原（2026-10-08 补充）

### 7.1 背景：依赖树被污染及复原

排查 Node 环境时误执行 `pnpm exec`，触发 pnpm 自动安装，把 npm 依赖树替换成 pnpm 的 **isolated 符号链接布局**（原 npm 包被移入 `node_modules/.ignored`）。该布局下 Docusaurus 无法正常工作，先后出现两类错误：

| 现象 | 原因 |
| --- | --- |
| `Cannot mix different versions of joi schemas` | 顶层残留旧实体包 `joi@17.13.4`，与 `.pnpm/joi@17.13.8` 并存 → 同时加载两个 joi 实例 |
| `unable to resolve the "@docusaurus/plugin-content-docs" plugin` | `node-linker=hoisted` 下顶层只有 11 个直接依赖，间接插件未被提升 |
| 仅首页路由生效、其余 404 | 上述依赖解析异常的连带表现 |

**复原方式**：删除 `node_modules` 与 pnpm 生成物后，用 **npm**（项目标准包管理器）执行 `npm ci` → 1322 个包、顶层 789 个实体包、`.pnpm` 残留清零、joi 单副本（17.13.4）、`package-lock.json` 无改动。

> **重要教训**：本项目是 **npm 工程**（`package-lock.json` + Dockerfile `npm ci` + CI 用 `setup-node` 的 npm 缓存）。**不要用 pnpm 安装依赖**；若必须用，需在 `.npmrc` 设 `node-linker=hoisted`（已添加该文件并在其中注明）。即便如此，pnpm 与 Docusaurus 仍不保证完全兼容。

### 7.2 本地构建通道

本机无 Node，采用便携版方案（安装到项目外临时目录，不污染项目、不改系统 PATH）：

```
# 1) 下载并解压 Node 20 LTS（与 Dockerfile / CI 版本一致）
$dest = "$env:TEMP\docusaurus-node20"
#   来源: https://npmmirror.com/mirrors/node/v20.19.5/node-v20.19.5-win-x64.zip
# 2) node.exe 路径
$nodeExe = "$dest\node-v20.19.5-win-x64\node.exe"      # v20.19.5
$npmCli  = "$dest\node-v20.19.5-win-x64\node_modules\npm\bin\npm-cli.js"   # npm 10.8.2
```

### 7.3 构建与预览命令

```powershell
$nodeExe = "$env:TEMP\docusaurus-node20\node-v20.19.5-win-x64\node.exe"
$env:DISABLE_LAST_UPDATE = "1"        # 无完整 git worktree 时跳过「最后更新时间」

# 构建（必须先临时移开 static\admin —— 它是 OneDrive 云占位符，
# Docusaurus 清理 build 目录时会因 rmdir EPERM 失败）
Rename-Item static\admin static\admin_offline_tmp
& $nodeExe node_modules\@docusaurus\core\bin\docusaurus.mjs build --out-dir buildlocal
Rename-Item static\admin_offline_tmp static\admin    # 立即复原

# 本地预览
python -m http.server 8080 --directory buildlocal --bind 127.0.0.1
```

构建结果：`[SUCCESS]` for `zh-Hans` 与 `en` 两个 locale，产物 448 个 HTML 页面。

### 7.4 本地验证结果

对构建产物逐个解析版本下拉 `dropdown__link`，与线上结果一致：

| 页面 | 下拉项 |
| --- | --- |
| `en/modules/10.5GHz/edx106/` | `Next` / `1.0.0` / `简体中文` / `English` |
| `modules/10.5GHz/edx106/`（中文站） | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/sensors/60GHz康养/edv21c/` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/accessories/edc593/` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/opensource/intro/` | `Next` / `1.0.0` / `简体中文` / `English` |
| `en/`（首页，非 docs 页） | 无版本下拉（符合预期：版本下拉仅在产品线页面出现） |

### 7.5 已知环境坑（后续排查用）

1. **`static/admin` 是 OneDrive 云文件占位符**（reparse tag `0x9000e01a`）。构建前必须临时移开，否则 Docusaurus 删除 build 目录时报 `EPERM: operation not permitted, rmdir ...\build\admin`。
2. **不要对含 junction 的 `build/` 做递归删除** —— 会波及链接目标。
3. **`docusaurus start` 的 dev server 在本机不可靠**：即使依赖树干净、`.docusaurus/routes.js` 已正确生成 258 条路由，dev server 运行时仅挂载首页，其余路径 404。用 `build` + 静态服务器替代即可（本次即如此，且完全满足验证需求）。

---

## 8. 变更落库记录

| 提交 | 内容 | 验证 |
| --- | --- | --- |
| `9434f53` | 修复 9 个 i18n 文件的 `version.label` | GitHub Actions 双站构建成功 → 线上核验 5 个实例下拉均为 `Next` / `1.0.0` |
| 本次提交 | 本地构建环境配套：`.npmrc`（`node-linker=hoisted`）、`.gitignore`（忽略 `/buildlocal` 与 `*.log`）、本归档文档 | 本地 `docusaurus build` 双站构建成功（448 页），本地静态预览逐页核验通过 |

未纳入本次提交（有意保留在工作区）：`sensors_docs/` 与 `sensors_versioned_docs/` 下 EDV21C 相关的进行中改动。

> **注意**：本文件位于 `docs/` 下，会被 Docusaurus 作为文档页面发布到站点（当前 `versions.json` 未含新版本，故仅出现在 Next 版本）。若希望它只作为仓库内部记录、不公开到站点，可将其移至 `docs/` 之外的目录（如仓库根 `notes/`），或为其添加 `draft: true` frontmatter。
