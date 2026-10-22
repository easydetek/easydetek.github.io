---
title: "EDK60 多工程 Demo（ed_edk60_demos）"
sidebar_position: 2
description: "EDK60 开发板的 ESP-IDF 示例工程仓库：17 个 demo 用 menuconfig 单选编译，含板级支持包、引脚表、避坑清单、雷达透传 demo 与配套网页工具"
---

# EDK60 多工程 Demo（ed_edk60_demos）

> 仓库：[GitHub · easydetek/ed_edk60_demos](https://github.com/easydetek/ed_edk60_demos) ｜
> 国内镜像：[Gitee · easydetek/ed_edk60_demos](https://gitee.com/easydetek/ed_edk60_demos) ｜ 许可：MIT

**一套工程、多个 demo**：所有示例放在同一个 ESP-IDF 工程里，用 `idf.py menuconfig` → **EDK60 Demo → 选择要编译的 Demo** 单选一个编译运行，不用为每个 demo 切分支或换目录。

| 项目 | 内容 |
|---|---|
| 主控 | ESP32-C6-MINI-1-N4（RISC-V 单核 @160 MHz，4 MB Flash，无 PSRAM） |
| 开发框架 | ESP-IDF **v6.1** |
| 工程根目录 | 仓库根目录（`CMakeLists.txt` 直接位于此处） |
| 串口能力 | C6 **原生 USB Serial/JTAG**（IO12 / IO13），板上**无** USB 转串口芯片 |
| 板级支持包 | `components/edk60_board`（引脚宏 + LED / 按键 / I2C / 雷达电源 / 控制台），引脚写错会**编译期报错** |
| 许可 | MIT |

## 快速开始

```powershell
# 1. 激活 ESP-IDF v6.1 环境（或按 docs/vscode-setup.md 用 VS Code 插件）
idf.py --version

# 2. 选 demo 并编译
idf.py set-target esp32c6        # 本工程只支持 esp32c6
idf.py menuconfig                # → "EDK60 Demo" → "选择要编译的 Demo"
idf.py build
idf.py -p COM<x> flash monitor   # Ctrl+] 退出监视

# 3. 批量编译全部 demo（回归验证用，每个 demo 独立 build-<demo>/ 目录）
powershell -ExecutionPolicy Bypass -File .\build_all.ps1 -List
powershell -ExecutionPolicy Bypass -File .\build_all.ps1
```

> VS Code 用户不需要命令行：装 ESP-IDF 插件后，按仓库 [docs/vscode-setup.md](https://github.com/easydetek/ed_edk60_demos/blob/main/docs/vscode-setup.md) 图形化选 demo / 编译 / 烧录 / 监视。

## Demo 清单（17 个）

**基础外设组**

| # | demo | 目的 | 关键观察点 |
|---|---|---|---|
| 1.1 | `hello_board` | 板卡自检 + 串口心跳 | 上电打印 EDK60 横幅；RX/TX 两颗黄灯各闪一次；每 5 秒打印运行时长与空闲堆 |
| 1.2 | `blink` | 最小 GPIO 输出 | IO8 慢闪 1 Hz、IO9 快闪 5 Hz |
| 1.3 | `button` | 按键输入（轮询 vs 中断消抖） | 按下/松开都打印；按住 ≥2 秒标为长按；与 100 ms 轮询结果对照 |
| 1.4 | `uart_echo` | 硬件 UART 收发 | UART1 重映射到 IO16 / IO17，发什么回显什么（ASCII + HEX） |
| 1.5 | `adc_read` | ADC1 六通道采集与校准 | A0–A5 每通道打印 raw / 校准 mV，末行输出可喂示波器的 CSV |

**无线组（Wi-Fi 6 / BLE 5）**

| # | demo | 目的 | 关键观察点 |
|---|---|---|---|
| 2.1 | `wifi_sta` | STA 扫描 / 连接 / 状态 | 打印 AP 表（SSID / BSSID / 信道 / RSSI / 加密）；断线自动重连 |
| 2.2 | `wifi_softap` | SoftAP + DHCP | 手机可连接并拿到 IP；实时打印站点上下线 |
| 2.3 | `ble_uart` | BLE 串口透传（NUS 兼容） | 手机 nRF Connect 能发现 `EDK60-BLE-UART` 并收发 |
| 2.4 | `ble_scan` | BLE 广播扫描 | 解析名字 / UUID / 厂商数据 / iBeacon，按周期输出 RSSI 汇总 |

> Wi-Fi 只支持 **2.4 GHz**；ESP32-C6 无经典蓝牙，BLE demo 使用 NimBLE 协议栈。

**板载互动组（针对 EDK60 特有电路）**

| # | demo | 目的 | 关键观察点 |
|---|---|---|---|
| 3.1 | `radar_power` | 3.3V_RADAR 使能时序 + 雷达 UART 观测 | 演示一次**关→开**电源复位；**丝印 “L” 的橙灯亮 = 雷达已上电**；未插模组会给出静默诊断；BOOT 键切换电源 |
| 3.2 | `led_sequence` | LEDC PWM 灯效编排 | 5 种灯效（交替 / 呼吸 / 追光 / 交叉呼吸 / SOS），BOOT 键循环 |
| 3.3 | `i2c_scan` | I2C 总线扫描 | 打印地址网格 + 常见器件识别；**空板扫不到是正常现象** |

**低功耗与存储组**

| # | demo | 目的 | 关键观察点 |
|---|---|---|---|
| 4.1 | `deep_sleep` | 深睡 + 三种唤醒源 | 打印唤醒原因与累计次数；LED 闪次编码唤醒源；EXT1 仅 IO0–IO7 |
| 4.2 | `nvs_rw` | NVS 读写 / 统计 | 打印「本机第 N 次启动」、键值清单、分区使用统计 |
| 4.3 | `usb_serial_bridge` | 原生 USB ⇄ UART 桥（调试视图） | PC 出现 USB 串行设备；本地回环可验证 USB 通路。⚠ **实际单向**：「雷达→USB」可用，「USB→雷达」因 UART1 的 TX 未布线而物理不通 |

**雷达透传组**

| # | demo | 目的 | 关键观察点 |
|---|---|---|---|
| 5.1 | `radar_bridge` | **EDV151 体征雷达**原始字节透传（不解析协议） | 自动识别接收脚与波特率；使能后橙灯亮；PC 打开 USB 串行设备即可看到原始字节；本地回环自测 |
| 5.2 | `radar_bridge_edv11p` | **EDV11P 侧装雷达**纯字节透传（零协议注入、零 `printf`） | USB 流里只有雷达数据；上电后需主机下发一次 `SET 0x05=1` 才开始上报；配套 `release/track.html` 与 `tools/edv11p_frame_check.py` |

**5.1 与 4.3 的区别**：4.3 是通用 USB↔UART 桥 + 调试视图；5.1 是面向雷达模组开箱即用的透传，多了「自动识别接收脚与波特率」「雷达电源使能控制」「本地回环自测」三项能力。两者都只做字节搬运。

## 只想在 PC 上看雷达数据：三步

1. 选 demo 并烧录：`build_all.ps1 -Demo radar_bridge` → `idf.py -p COM<x> flash`
2. 看**控制台**（H2 排针 D0/RX(IO16)、D1/TX(IO17)，**115200**）确认识别到雷达与波特率
3. 在 PC 上打开**USB 串行设备**（VID 303A）收原始字节——波特率随意（USB CDC 不依赖波特率）

:::warning 日志与数据是两条链路
C6 的 USB Serial/JTAG 只有一个外设。若把控制台日志也接到 USB，日志会与雷达数据混进同一个 FIFO，
数据流就被污染了。`radar_bridge` 默认在 `sdkconfig.defaults.radar_bridge` 里关掉了该选项，并带编译期保护。
:::

站内配套文档：

- [生命体征检测实施指南（EDK60 + EDV151）](/opensource/开源硬件/EDK60/flash-guide)：零基础、免安装，网页一键烧录体征固件
- [人数统计雷达实施指南（EDV11P 侧装）](/opensource/开源硬件/EDK60/track-guide)：接线 → 烧录 → 看到轨迹的完整配方

## 仓库里的关键文档

| 文档 | 用途 |
|---|---|
| `docs/EDK60-pinmap.md` | 引脚定义表（含实测结论）、雷达电源控制、电源树、待实测确认项 —— **写代码前必读** |
| `docs/EDK60-pitfalls.md` | 开发避坑清单 + 排障速查表 |
| `docs/vscode-setup.md` | VS Code + ESP-IDF 插件使用说明 |
| `docs/flash-guide-for-beginner.md` | 新手烧录指南（与本站[生命体征检测实施指南](/opensource/开源硬件/EDK60/flash-guide)同源） |
| `docs/tutorial-edv151-vital-signs.md` | EDV151 体征雷达打通全过程（开发者教程） |
| `docs/recipe-edv11p-person-tracking.md` | EDV11P 侧装人数统计实施指南 |
| `docs/case-edv11p-person-tracking.md` | EDV11P 应用案例（含 30 分钟实测数据与轨迹图） |
| `docs/SCH_EDK60_VA.pdf` | 原理图（EDK60_VA V1.0） |
| `release/` | 网页烧录 / 实时监测 / 轨迹演示页面与固件 |

## 硬件红线（违反会踩坑）

| 事项 | 说明 |
|---|---|
| 雷达引脚（已实测） | 模组 TX→**IO4**、模组 RX←**IO5**、电源 EN=**IO14**、橙灯=IO15。早期按图纸推断「EN=IO15、RX=IO14」两个都错，已由 2026-10-15 上板实测推翻 |
| 模组必须插 H3 | H4 的 `T` 脚与电源使能同网络，插 H4 会互相干扰 |
| 射频默认关闭 | 必须下发 `turn_on`，否则没有任何体征数据 |
| 增益过大会恒为 0 | 出厂 `gain=4 / boost=0` 会让心率呼吸永远算不出来，需 `set_gain 0.5` + `set_boost 2` |
| 雷达接口只有 RX | IO15 被电源使能占用，且 C6 的 UART1 无 IOMUX 默认引脚，H4 上没有给雷达的独立 TX —— 无法主动向雷达发命令（`usb_serial_bridge` 因此是单向的） |
| USB 是单一外设 | USB Serial/JTAG 只有一个，PC 上只呈现一个 COM 口；JTAG 与数据分时复用，不开调试器不占链路 |
| IO8 / IO9 是 strapping | 复位瞬间不要外接强驱动；IO9 同时是 BOOT 键，上电按住会进下载模式 |
| IO12 / IO13 被 USB 占用 | 拿去当 GPIO 会失去 USB 串口与调试能力 |
| ADC 只能用 ADC1 | C6 的 ADC2 不提供给用户程序；IO7 无 ADC；输入不得超过 3.6 V |

完整红线与实测依据见仓库 `docs/EDK60-pitfalls.md` 与 `docs/EDK60-pinmap.md`。

## 相关文档

- [EDK60 开发板](/opensource/开源硬件/EDK60/)：硬件概述、附件与资料、在线工具
- [应用案例：EDK60 + EDV151 呼吸心率监测方案](/blog/edk60-vital-signs-edv151)
- [应用案例：EDK60 + EDV11P 侧装人数统计与轨迹跟踪](/blog/edk60-edv11p-person-tracking)
- [ed_radar 组件](./ed-radar)：多款雷达的 ESP-IDF 统一抽象接口层
