---
title: "Modbus RTU 协议说明"
sidebar_position: 3
---

# EDV25P-4 Modbus RTU 协议说明

> EDV25P-4（RS485 / Modbus 版）Modbus RTU 协议在线版，整理自知识库《EDV2XX Modbus RTU 协议说明》V1.1（2026-07-15）

## 适用范围与版本

本文档定义 EDV25P-4（RS485 / Modbus 版）所用固件 `EDV2XX-CTRL-FW` 的 RS485 / Modbus RTU 协议，适用于 `0x0000` 起的 Holding Registers 与 `0x1000` 起的 Input Registers 的读写，以及 `apply_command` / `apply_result` 配置下发流程。

- **协议层**：Modbus RTU 从机（标准 Modbus 类总线协议）
- **物理层**：RS485 半双工总线（EDV25P-4 通过 A / B 端子接入）
- **角色关系**：上位机 / PLC / 网关为主站，EDV25P-4 为从站

:::info 版本说明
本页为 V1.1 版本，相对 V1.0 的变更为 **EDV25P-4 实现对齐**：新增扩展基础参数（`0x00D0-0x00D2`）、输入寄存器扩展（`0x100B-0x100F`）、设备信息块（`0x1B20`）；`0x000F` 功能确认。文中标注 🆕 的条目为 V1.1 新增内容。
:::

### 版本信息

| 序号 | 版本 | 日期 | 作者 | 变更说明 |
|---|---|---|---|---|
| 1 | V1.0 | - | - | 初始版本，基础 Modbus RTU 协议定义 |
| 2 | **V1.1** | 2026-07-15 | gongdezhi | EDV25P-4 实现对齐：新增扩展基础参数(0x00D0-0x00D2)、输入寄存器扩展(0x100B-0x100F)、设备信息块(0x1B20)；0x000F 功能确认 |

> 🆕 标记为 V1.1 新增内容

## 1. 适用范围

本文档定义 `EDV2XX-CTRL-FW` 当前项目的 RS485 / Modbus RTU 协议。

设计原则：

1. 保持当前 Modbus RTU 功能码与基础寄存器模型稳定
2. 保持全局参数、总体检测边界、分区配置、分区结果的统一结构
3. 增加控制板联网参数、工作模式与雷达扩展状态

## 2. 协议角色

| 项目 | 说明 |
| --- | --- |
| 物理层 | RS485 半双工 / UART 直连（由具体板型决定） |
| 协议层 | Modbus RTU 从机 |
| 角色关系 | 上位机 / PLC / 网关为主站，设备为从站 |

说明：

1. 协议层采用标准 Modbus RTU 从机模型
2. 当前项目的硬件引脚、串口实例可因板型不同而变化
3. 对外协议不依赖 `ed_unity_protocol` 帧格式

## 3. 串口参数

默认建议值：

| 项目 | 默认值 |
| --- | --- |
| 波特率 | 9600 |
| 数据位 | 8 |
| 校验位 | None |
| 停止位 | 1 |
| CRC | Modbus CRC16 |

说明：

1. 默认建议使用 `9600 8N1`
2. 当前项目扩展支持把 `从站地址 + 波特率档位` 作为配置项
3. 若波特率被修改，主站必须同步切换到同样波特率

:::note 备注
EDV25P-4 的 RS485 端子为 A（RS485-A）/ B（RS485-B），供电端子为 V（DC 12-30V）/ G（GND），接线方式见[规格书](./spec)的「接口说明」一节。EDV25P-4 另提供蓝牙 BLE 与 UART 串口作为通用接口，用于小程序调试/参数配置与本地调试/数据透传。
:::

## 4. 设计原则

### 4.1 不定义总人数

目标结果按 **感应区 `zone_id`** 分组，感应区允许重叠，因此：

- 同一目标可能出现在多个感应区结果中
- 协议不定义全局人数 / 全局目标总数

### 4.2 保持三层结构

Modbus 对外模型继续保持三层：

1. 全局参数
2. 总体检测边界
3. 感应区 / 屏蔽区配置与分区结果

### 4.3 保持「暂存 + apply」

配置写入采用：

1. 先写 Holding Registers 暂存镜像
2. 再写 `apply_command`
3. 最后读 `apply_result`

这样可以适应更复杂的控制板与雷达配置组合，并保持寄存器访问流程清晰稳定。

## 5. 支持的功能码

| 功能码 | 说明 |
| --- | --- |
| 0x03 | 读 Holding Registers |
| 0x04 | 读 Input Registers |
| 0x06 | 写单个 Holding Register |
| 0x10 | 写多个 Holding Registers |

不支持：

- 0x05
- 0x0F

## 6. Holding Registers

### 6.1 基础 Holding Registers

以下区间构成当前协议的基础 Holding Registers：

| 区间 | 说明 |
| --- | --- |
| 0x0000~0x000F | 基础全局参数与总体检测边界摘要 |
| 0x0010~0x0055 | 感应区配置块 |
| 0x0080~0x00C5 | 屏蔽区配置块 |
| 0x00F0~0x00F1 | apply_command / apply_result |
| 0x00C6~0x00CF | 控制板与联网参数（V1.1 新增） |
| 0x00D0~0x00D2 | **扩展基础参数（V1.1 新增）** |

#### 6.1.1 基础全局参数

| 地址 | 名称 | 类型 | R/W | 说明 |
| --- | --- | --- | --- | --- |
| 0x0000 | protocol_version | uint16 | R | 协议版本号 |
| 0x0001 | motion_sensitivity | uint16 | R/W | 运动灵敏度 |
| 0x0002 | presence_sensitivity | uint16 | R/W | 存在灵敏度 |
| 0x0003 | overall_presence_hold_s | uint16 | R/W | 整体有无人保持时间 |
| 0x0004 | install_height_mm | uint16 | R/W | 安装高度 |
| 0x0005 | detect_x_min_mm | int16 | R/W | 总体检测 X 最小值 |
| 0x0006 | detect_x_max_mm | int16 | R/W | 总体检测 X 最大值 |
| 0x0007 | detect_y_min_mm | int16 | R/W | 总体检测 Y 最小值 |
| 0x0008 | detect_y_max_mm | int16 | R/W | 总体检测 Y 最大值 |
| 0x0009 | detect_z_min_mm | uint16 | R/W | 总体检测 Z 最小值 |
| 0x000A | detect_z_max_mm | uint16 | R/W | 总体检测 Z 最大值 |
| 0x000B | sensing_zone_count | uint16 | R/W | 感应区数量 |
| 0x000C | mask_zone_count | uint16 | R/W | 屏蔽区数量 |
| 0x000D | target_disappear_delay_s | uint16 | R/W | 目标消失延时 |
| 0x000E | presence_active_report_enable | uint16 | R/W | 有无人变化主动上报开关 |
| 0x000F | zone1_idle_report_enable | uint16 | R/W | Zone1 空闲主动上报开关 |

#### 6.1.2 感应区配置块

- 起始地址：0x0010
- 每区占 7 个寄存器
- 最多 10 个感应区

结构：

| 偏移 | 字段 | 类型 |
| --- | --- | --- |
| +0 | zone_id | uint16 |
| +1 | x_min_mm | int16 |
| +2 | x_max_mm | int16 |
| +3 | y_min_mm | int16 |
| +4 | y_max_mm | int16 |
| +5 | z_min_mm | uint16 |
| +6 | z_max_mm | uint16 |

#### 6.1.3 屏蔽区配置块

- 起始地址：0x0080
- 每区占 7 个寄存器
- 结构与感应区相同

### 6.2 控制板与联网参数 Registers

以下寄存器用于控制板工作模式、联网参数和附加通信参数：

| 地址 | 名称 | 类型 | R/W | 说明 |
| --- | --- | --- | --- | --- |
| 0x00C6 | device_work_mode | uint16 | R/W | 0=normal，1=passthrough |
| 0x00C7 | rs485_address | uint16 | R/W | 从站地址，范围 1~247 |
| 0x00C8 | rs485_baudrate_code | uint16 | R/W | 0=9600，1=19200，2=38400，3=57600，4=115200 |
| 0x00C9 | radar_work_mode | uint16 | R/W | 雷达工作模式 |
| 0x00CA | radar_report_period_ms | uint16 | R/W | 雷达上报周期，单位 ms |
| 0x00CB | mqtt_enabled | uint16 | R/W | 0=关闭，1=开启 |
| 0x00CC | mqtt_report_period_ms | uint16 | R/W | MQTT 上报周期 |
| 0x00CD | mqtt_port | uint16 | R/W | MQTT 端口 |
| 0x00CE | passthrough_port | uint16 | R/W | TCP 透传端口 |
| 0x00CF | ota_server_port | uint16 | R/W | OTA 服务器端口 |

#### 6.2.1 扩展基础参数（V1.1 新增）🆕

以下寄存器为基础全局参数的扩展，对接 BLE 协议命令：

| 地址 | 名称 | 类型 | R/W | 说明 |
| --- | --- | --- | --- | --- |
| 0x00D0 | presence_detect_switch | uint16 | R/W | 存在检测总开关，0=关闭(强制无人) 1=开启(默认)，↔ BLE 0x1A |
| 0x00D1 | led_switch | uint16 | R/W | LED 开关，0=关 1=开，↔ BLE 0x17 |
| 0x00D2 | radar_switch | uint16 | R/W | 雷达开关，0=关(断电) 1=开，↔ BLE 0x23 |

### 6.3 字符串配置块

由于 Wi-Fi / Host 字符串不适合单寄存器表达，新增固定长度字符串块：

| 起始地址 | 名称 | 长度 | 说明 |
| --- | --- | --- | --- |
| 0x0200 | wifi_ssid_block | 32 regs | Wi-Fi SSID |
| 0x0220 | wifi_password_block | 32 regs | Wi-Fi Password |
| 0x0240 | mqtt_host_block | 32 regs | MQTT Host |
| 0x0260 | passthrough_host_block | 32 regs | 透传 Host |
| 0x0280 | ota_server_host_block | 32 regs | OTA 服务器 Host |

编码规则建议如下：

1. `block[0]`：字符串实际字节长度
2. `block[1...]`：后续寄存器每个寄存器存放 2 个 ASCII 字节
3. 未使用部分补 `0x00`

### 6.4 apply_command / apply_result

#### 6.4.1 0x00F0 apply_command

| 值 | 含义 |
| --- | --- |
| 0x0001 | 应用基础全局参数 |
| 0x0002 | 应用总体检测边界 |
| 0x0003 | 应用感应区配置 |
| 0x0004 | 应用屏蔽区配置 |
| 0x0005 | 应用扩展通信参数 |
| 0x0006 | 应用字符串配置块 |
| 0x00FF | 应用全部暂存配置 |

#### 6.4.2 0x00F1 apply_result

| 值 | 含义 |
| --- | --- |
| 0x0000 | 成功 |
| 0x0001 | 基础全局参数非法 |
| 0x0002 | 总体检测边界非法 |
| 0x0003 | 感应区配置非法 |
| 0x0004 | 屏蔽区配置非法 |
| 0x0005 | 下发设备 / 雷达失败 |
| 0x0006 | 扩展通信参数非法 |
| 0x0007 | 字符串配置块非法 |

## 7. Input Registers

### 7.1 基础 Input Registers

以下输入寄存器用于摘要状态和分区结果读取：

| 地址 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 0x1000 | update_seq_lo | uint16 | 更新序号低 16 位 |
| 0x1001 | update_seq_hi | uint16 | 更新序号高 16 位 |
| 0x1002 | active_zone_bitmap | uint16 | 已启用感应区位图 |
| 0x1003 | occupied_zone_bitmap | uint16 | 当前有目标的感应区位图 |
| 0x1004 | overall_presence_state | uint16 | 整体有无人状态 |

感应区结果块地址如下：

- Zone1 = 0x1100
- Zone2 = 0x1200
- ...
- Zone10 = 0x1A00

每区结构仍为：

1. `zone_id`
2. `zone_target_count`
3. 最多 20 个目标槽位
   - `target_id`
   - `x_mm`
   - `y_mm`
   - `z_mm`

### 7.2 运行状态 Input Registers

| 地址 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 0x1005 | fall_state | uint16 | 0=正常，1=疑似跌倒，2=确认跌倒 |
| 0x1006 | current_device_work_mode | uint16 | 当前控制板工作模式 |
| 0x1007 | current_radar_work_mode | uint16 | 当前雷达工作模式 |
| 0x1008 | wifi_state | uint16 | 0=未配置，1=已连接，2=连接中，3=失败 |
| 0x1009 | mqtt_state | uint16 | 0=关闭，1=已连接，2=连接中，3=失败 |
| 0x100A | passthrough_state | uint16 | 0=空闲，1=连接中，2=已连接，3=异常 |

#### 7.2.1 扩展运行状态（V1.1 新增）🆕

| 地址 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 0x100B | illuminance_lux | uint16 | 光敏照度值（LTR303），单位 lux |
| 0x100C | occupied_duration_s_lo | uint16 | 有人持续时长低 16 位 |
| 0x100D | occupied_duration_s_hi | uint16 | 有人持续时长高 16 位（32bit 秒值） |
| 0x100E | no_presence_duration_s_lo | uint16 | 无人持续时长低 16 位 |
| 0x100F | no_presence_duration_s_hi | uint16 | 无人持续时长高 16 位（32bit 秒值） |

### 7.3 雷达信息块

为承载雷达扩展信息，定义只读信息块：

| 起始地址 | 名称 | 长度 | 说明 |
| --- | --- | --- | --- |
| 0x1B00 | radar_info_block | 32 regs | 雷达产品信息 / 模块版本 / 软件 ID / 协议版本 |

#### 7.3.1 设备信息块（V1.1 新增）🆕

| 起始地址 | 名称 | 长度 | 说明 |
| --- | --- | --- | --- |
| 0x1B20 | device_info_block | 32 regs | 控制板设备信息：型号 / 软件版本 / MAC 地址 / 能力码 |

编码规则与字符串配置块一致：

1. 第一个寄存器表示实际字节长度
2. 后续寄存器按 2 字节 ASCII 打包

## 8. 主动状态上报

### 8.1 主动状态帧

当前协议定义两类主动帧：

1. `overall_presence_state` 变化主动上报
2. `Zone1` 空闲主动上报

这样可以让串口监听场景下的状态上报保持简单直接。

### 8.2 新增主动状态建议

对于当前项目增加的联网与扩展状态，建议仍以 **主站轮询读取** 为主，不在第一版协议中新增更多主动帧类型。

若后续确需新增，建议新增到新的独立触发开关，并保持帧格式与对应输入寄存器读取结果一致。

## 9. 设计约束

1. 已定义寄存器的含义不得重定义
2. 已定义功能码不得变化
3. 新功能优先通过：
   - 新增 Holding 区
   - 新字符串块
   - 新增 Input 区
   来承载

## 附录 A：V1.1 新增寄存器汇总 🆕

| 地址 | 名称 | 类型 | 区 | 说明 |
| --- | --- | --- | --- | --- |
| 0x00D0 | presence_detect_switch | uint16 | Holding | 存在检测总开关 ↔ BLE 0x1A |
| 0x00D1 | led_switch | uint16 | Holding | LED 开关 ↔ BLE 0x17 |
| 0x00D2 | radar_switch | uint16 | Holding | 雷达开关 ↔ BLE 0x23 |
| 0x100B | illuminance_lux | uint16 | Input | 光敏照度值 |
| 0x100C-0x100D | occupied_duration_s | uint32 | Input | 有人持续时长（秒） |
| 0x100E-0x100F | no_presence_duration_s | uint32 | Input | 无人持续时长（秒） |
| 0x1B20 | device_info_block | 32 regs | Input | 控制板设备信息块 |

> 上表全部条目均为 V1.1 新增；基础寄存器（0x0000-0x000F、0x0010-0x0055、0x0080-0x00C5、0x00F0-0x00F1、0x0200-0x0280、0x1000-0x100A、0x1B00）沿用 V1.0 定义，含义未变更。
