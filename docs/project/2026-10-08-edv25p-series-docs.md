# EDV25P 系列产品文档创建记录

- **日期**：2026-10-08
- **任务来源**：用户要求「在 60GHz 康养监护下创建新产品 EDV25P，方法跟 EDV21C 一致」
- **交付位置**：`sensors_docs/60GHz康养/edv25p/` 与 `sensors_versioned_docs/version-1.0.0/60GHz康养/edv25p/`（两份内容一致）

---

## 1. 决策记录（用户拍板）

| 决策点 | 结论 |
| --- | --- |
| 变体结构 | 按规格书附录 A.1 建**三变体**：RS485（-4）/ KNX（-K）/ 涂鸦 Zigbee（-T） |
| 既有目录处理 | 迁移并删除旧内容；`Tuya-涂鸦/edv25p-t-02/` **改造为导航入口页**，正文指向 60GHz 栏目 |
| 交付深度 | 完整套（规格书在线版 + 协议 + 使用说明在线版 + PDF 与配图入库）+ **同步版本化副本** |

## 2. 事实来源（权威渠道）

| 来源 | 用途 |
| --- | --- |
| 钉钉产品表（node `14lgGw3P8vvQRw5dUg2exAlg85daZ90D` / sheet `kgqie6hm`） | 型号、状态、频段、电气与安装参数、特点 |
| 钉钉知识库 `EDV25P系列`（node `dpYLaezmVNL4eGzlhGM156YQ8rMqPxX6`） | 规格书、使用说明书、Modbus 协议、MQTT 协议、KNX 工程文件 |
| 《EDV25P 系列规格书》V1.0.0（2026-09-15，14 页，中英对照） | 三版本定义（附录 A.1）、参数表、图 1.1–1.10 |
| 《EDV25P 使用说明书》V1.0.0（23 页） | 安装接线、功能时序、小程序指南、图 3.1–3.8 |

**产品事实（关键）**：系列三版本共用同一硬件平台（57.5–61.3GHz 毫米波雷达 + 内置数字光照传感器），差异仅在供电与通讯：

| 型号 | 供电 | 通讯 | 定位 |
| --- | --- | --- | --- |
| EDV25P-4 | DC 12-30V | RS485 总线（Modbus 类协议） | 工业/楼宇总线组网 |
| EDV25P-K | DC 12-30V | KNX 总线 | KNX 智能家居/楼宇自动化 |
| EDV25P-T | AC 90-277V | 涂鸦 Zigbee 协议 | 涂鸦 APP 联动 |

在研具体型号：**EDV25P-T-02**（钉钉产品表状态：研发测试）。

## 3. 交付物清单

```
sensors_docs/60GHz康养/edv25p/
├── _category_.json                    label=EDV25P
├── index.md                           系列概览（核心特点/规格参数/6 项 FAQ/产品形态/相关文档）
├── usage-manuals.md                   使用说明在线版（1–5 章 + 附录 A/B，对应说明书 23 页）
├── mqtt-protocol.md                   MQTT 协议说明（619 行源文档全量保留）
├── assets/                            系列规格书（中英对照）+ 中文版 + 使用说明书（3 PDF）
├── assets/manual25p/                  20 张说明书配图（图1.1–1.10、图3.1–3.8）
├── tuya-zigbee/                       EDV25P-T
│   ├── _category_.json                key=edv25p-tuya-zigbee, position=1
│   ├── index.md / spec.md
│   └── assets/spec-img/               8 张（图1.1/1.2/1.3/1.6/1.7/1.8/1.9/1.10）
├── knx/                               EDV25P-K
│   ├── _category_.json                key=edv25p-knx, position=2
│   ├── index.md / spec.md
│   └── assets/spec-img/               11 张（含图1.3 三视图拼接版 + 三张拆分版）
└── rs485-modbus/                      EDV25P-4
    ├── _category_.json                key=edv25p-rs485-modbus, position=3
    ├── index.md / spec.md / modbus-protocol.md
    └── assets/spec-img/               10 张（图1.1–1.4、1.7–1.10）
```

**统计**：10 个 md、49 张配图、3 个 PDF；`sensors_docs` 与 `versioned` 两份内容一致。

### 配图 → 图号映射（三变体）

| 图号 | rs485-modbus | knx | tuya-zigbee |
| --- | --- | --- | --- |
| 图1.1 正面视图 | spec-front-view.png | 同左 | 同左 |
| 图1.2 背面视图 | spec-back-view.png | 同左 | 同左 |
| 图1.3 外形尺寸 | spec-dimension.png(侧) + -top + -bottom | spec-dimension.png(**拼接**)+ -side/-top/-bottom | spec-dimension.png(**拼接**) |
| 图1.4/1.5/1.6 接口图 | spec-pins.png（**-4 专用**） | spec-pins.png（**-K 专用**，含图1.7） | spec-pins.png（**-T 专用**） |
| 图1.7 按键 | spec-button.png | spec-button.png | spec-button.png |
| 图1.8 安装方向与分区 | spec-detect-zone.png | 同左 | 同左 |
| 图1.9 挂高角度性能 | spec-mount-angle.png | 同左 | 同左 |
| 图1.10 感应性能 | spec-sensing.png | 同左 | 同左 |

> 接口图归属由三位工程师各自用 `read_image` 逐张目视 + pypdf 解析 `cm/Do` 变换矩阵与图注坐标交叉验证，rs485 变体另以 SHA256 与说明书 `interface-4.png` 比对一致；未出现变体间图混用。

## 4. 验证证据

| 验证项 | 结果 |
| --- | --- |
| 站内引用校验（脚本） | 79 个引用（图片/文档/PDF）**全部有效** |
| 本地全量构建 | `docusaurus build`：`[zh-Hans] SUCCESS` + `[en] SUCCESS`，exit 0 |
| 产物页面 | 10 个页面 × 3 处（中文 next / 中文 1.0.0 / 英文）全部生成 |
| 资源入库 | 产物中 87 个 EDV25P 相关图片资源 |
| 版本下拉回归 | sensors 页显示 `Next` / `1.0.0`（正常） |
| MQTT 归属提示 | `:::caution` 块已渲染 |
| 旧入口页 | `Tuya-涂鸦/edv25p-t-02/` 中英文均正常生成 |

## 5. 施工中拦下并修复的 4 类构建阻断问题

| # | 问题 | 影响 | 修复 |
| --- | --- | --- | --- |
| 1 | **MDX 3 无法解析 `<` 紧跟数字**（`<5W`、`KNX<2W`），4 处 | 整站构建失败 | 改为全角 `＜`（与 EDV21C 模板既有约定一致） |
| 2 | `knx/` 两处 PDF 链接多退一级（`../../assets/`） | `onBrokenLinks: 'throw'` 下整站失败 | 改为 `../assets/` |
| 3 | 三变体 spec.md 用 `./index` 链接 index.md | 解析为 `/knx/index` 而实际路由是 `/knx/` | 改为 `./index.md` |
| 4 | EDV21C 与 EDV25P 均有「KNX 版」「RS485（Modbus）版」分类 → 翻译键重复 | 英文站构建失败 | 三个变体分类加唯一 `key`（`edv25p-*`） |

> 问题 1、2 由 EDV25P-T 文档工程师在完成自身工作后**主动越界预警**（含 micromark 源码级证据与实测路径），是本次能在提交前拦下的关键。问题 4 的 `key` 同时为将来其他产品线复用同名分类做了预防。

## 6. 待人工核对项（**需研发/产品确认，非文档缺陷**）

| # | 事项 | 现状处理 |
| --- | --- | --- |
| 1 | **MQTT 协议归属**：文档网络层为 Wi-Fi STA，但规格书附录 A.1 三版本均无 Wi-Fi | 页首 `:::caution 适用型号待确认` + 两处交叉提示；未做任何归属推断 |
| 2 | 图1.4 端子丝印方向（仰视图呈镜像 B-A-G-V，物理顺序应为 V-G-A-B） | 正文标注「图待核对」并保留原图注 |
| 3 | 图1.6 端子连通关系（4 端子位 L-N-N-L，表仅给 L/N；是否 L-L/N-N 互联、可否手拉手供电未说明） | 同上 |
| 4 | 图1.3 各视图方向（三种视图方向系依据图纸内容判读，图面无文字标识） | 标注「方向标注待人工核对」，部分变体保留原图注顺序 |
| 5 | **版本日期自相矛盾**：封面/文件名 2026-09-15，正文版本记录页 2026-08-20 | 沿用 2026-08-20 并在 spec 加备注，建议研发澄清 |
| 6 | 命名规范章节未收录（规格书第 2 章为图形化表格，纯文本提取行列错位，P 位与扩展功能位无法可靠对应） | 未写该章节（EDV21C 模板亦无）；提示 rs485 变体已写命名规则但未解释 P 位，建议统一 |
| 7 | 说明书附录 B「应用案例」源 PDF 无正文（仅 B.1/B.2 标题） | 在线版如实注明「正文待补充」，未编造 |
| 8 | 小程序仅一张长截图（图3.8） | 仅产出 `miniapp-functions.jpg`，未生造 login/bind 等不存在的图 |
| 9 | 图1.3 底面视图端子配色与 EDV25P-K 端子图一致 | 提示：若该图确为 KNX 专用，可能需按型号补图 |
| 10 | 说明书 4.1 通信接口表的 √ 在 PDF 文本层丢失 | 已用 pypdf layout 模式按列位核对：-4→RS485、-K→KNX、-T→涂鸦 Zigbee，蓝牙/UART 三版本全支持 |
| 11 | EDV25P-T 电气参数中的峰值/平均电流为 12V 测试值（属 -4/-K） | 已在电气参数节明确排除并加备注，避免误读为 -T 指标 |

## 7. 周边一致性改动（本次一并完成）

| 文件 | 改动 |
| --- | --- |
| `sensors_docs/60GHz康养/_category_.json`（含 versioned 副本） | 分类描述「2 款」→「3 款」 |
| `Tuya-涂鸦/edv25p-t-02/index.md`（含 versioned 副本） | 改造为导航入口页（保留规格摘要 + 指向 60GHz 栏目的三条链接） |
| `sensors_docs/intro.md`、`sensors_versioned_docs/.../intro.md` | 「跌倒检测／康养监护」条目改为 EDV25P 系列页，并标注三版本 |
| `i18n/en/.../docusaurus-plugin-content-docs-sensors/{current,version-1.0.0}/intro.md` | 英文站同步为 `EDV25P ... (RS485 / KNX / Tuya Zigbee versions)` |
| `scripts/regen-sensors.js` | 从 `GROUP_MAP` 移除 `EDV25P-T-02` 并写明原因（否则脚本重跑会生成冲突目录 `60GHz康养/edv25p-t-02/`） |

## 8. 待决项（需用户定夺）

1. **图1.3 呈现方式不统一**：`knx`、`tuya-zigbee` 用「三视图拼接版」，`rs485-modbus` 用「3 张独立视图」。统一需重制图片并同步改图注（可用 pyMuPDF 重渲染整页裁剪）。
2. **`_src-*.md` 工作素材去留**：`edv25p/_src-mqtt-protocol.md` 与 `edv25p/rs485-modbus/_src-modbus-protocol.md` 为整理前的源文档（文件名下划线开头，Docusaurus 默认不渲染、不影响构建）。建议移出文档目录或删除。
3. **规格书 PDF 存放策略**：EDV25P 为「一份系列规格书涵盖三版本」，故 PDF 置于系列级 `assets/` 由三变体引用，未复制 3 份 —— 与 EDV21C（各变体独立规格书）结构不同，属产品资料客观差异，是否接受请确认。
4. **是否将 EDV25P 纳入发布版本**：当前仅存在于 next（开发版）与 1.0.0 快照；若需正式发布需走版本化流程。

---

## 9. 撤销记录（2026-10-08 当日）

用户曾提出 EDV25P 另有 WiFi 版本（EDV25P-W）、并要求把 MQTT 协议归入该版本。据此已建立 `standard-wifi-mqtt/` 变体目录并把 MQTT 协议迁入。

随后**用户确认该型号不存在**（原话：「已经确认没有这个产品，后续的工作停止」），相关工作即刻停止并**完整撤销**：

| 撤销项 | 结果 |
| --- | --- |
| `standard-wifi-mqtt/` 变体目录（sensors_docs 与 versioned 两处） | 已删除（仅含本次新建的 `_category_.json` 与迁入的 `mqtt.md`，无既有内容丢失） |
| MQTT 协议文件 | 移回系列级 `edv25p/mqtt-protocol.md` |
| MQTT 协议归属提示 | 由「适用 EDV25P-W」恢复为 `:::caution 适用型号待确认` |
| `EDV25P-W` 残留引用 | 0 处（全库扫描） |
| 两份内容一致性 | sensors_docs 与 versioned 均为 10 个 md，完全一致 |
| 双站构建 | 撤销后重新验证通过（zh-Hans + en，exit 0） |

> **结论**：EDV25P 系列的版本构成仍为规格书附录 A.1 声明的**三个版本**（EDV25P-4 / -K / -T）；MQTT 协议文档的适用型号**仍待产品团队确认**（见第 6 节第 1 项）。
