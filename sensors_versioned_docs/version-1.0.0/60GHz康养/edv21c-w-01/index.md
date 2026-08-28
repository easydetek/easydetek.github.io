---
title: "EDV21C-W-01"
sidebar_position: 1
---

# EDV21C-W-01

> 支持人数统计，60GHz强抗干扰天线，蓝牙小程序调节｜60GHz 独立传感器｜🔧 研发测试

## 核心特点

支持人数统计，60GHz强抗干扰天线，蓝牙小程序调节

## 规格参数

| 参数 | 规格 |
|------|------|
| 工作频段 | 60GHz |
| 感应方式 | 毫米波 |
| 输入电压 | AC 90V~260V |
| 输出方式 | MQTT,BLE |
| 调参方式 | BLE |
| 安装方式 | 顶装嵌入式55mm开孔 |
| 产品状态 | 研发测试 |

## 相关 FAQ

- [如何选择频段](/docs/faq/模组选型/frequency-selection)
- [安装注意事项](/docs/faq/通用问题/installation)
- [供电与接线](/docs/faq/通用问题/power-wiring)

## MQTT 协议说明

> 本协议定义 EDV21C 的 MQTT 通信：设备上行遥测（occupancy/status/targets/zones/info/fall）、服务器下行配置与控制（reboot/ota/factory_reset）。数据格式 JSON，topic 前缀 `edv21c/{device_id}/`。

| 修改说明 | 日期 | 备注 |
| --- | --- | --- |
| 修改5.1 上行 topic（设备 -> 服务器）occupancy、status、targets、zones、info、fall指令，例：edv21c/\{device\_id\}/telemetry/radar/occupancy​改为edv21c/\{device\_id\}/telemetry/occupancy​ | 260608 | 基于260527版本修改为当前服务器实际使用的不包含radar路径的topic |
| 新增 control/factory\_reset 恢复出厂设置主题 | 260721 | 支持MQTT远程触发恢复出厂设置，响应到control/result |
|  |  |  |
|  |  |  |

### 1. 适用范围

本文档定义 EDV21C 项目的 MQTT 通信协议，包括：

1.  设备上行状态与目标数据上报
    
2.  服务器下行配置读取与设置
    
3.  控制类命令
    

MQTT 使用单个客户端连接同时完成发布与订阅。

### 2. 协议概述

| 项目 | 说明 |
| --- | --- |
| 网络层 | Wi-Fi STA |
| 传输层 | TCP |
| 应用层 | MQTT |
| 设备角色 | MQTT Client |
| 数据格式 | JSON |
| topic 前缀 | edv21c/\{device\_id\}/​ |

### 3. 设备标识规则

本协议 topic 中的 \{device\_id\}​ 表示设备标识。

设备标识取设备 Wi-Fi STA MAC，转换为 12 位小写十六进制字符串，不带分隔符。

示例：

```text
84f70312ab56

```

### 4. 连接与运行约束

设备满足以下条件时，才建立 MQTT 连接：

1.  已启用 MQTT 功能
    
2.  已完成路由器 Wi-Fi 名称配置
    
3.  已完成 MQTT 服务器地址配置
    
4.  已完成 MQTT 服务器端口配置
    
5.  控制板当前处于正常通信模式
    

控制板通信模式取值约定如下：

*   0​：正常通信模式
    
*   1​：TCP 透传模式
    

说明：

1.  正常通信模式下，MQTT 正常发布与订阅
    
2.  TCP 透传模式下，控制板进入 TCP 与雷达串口双向透传
    
3.  进入 TCP 透传模式后，MQTT 应主动退出运行态
    
4.  处于 TCP 透传模式时，其它通信通道只允许查询控制板当前通信模式并执行模式切换，不允许再向雷达下发普通业务配置
    

### 5. Topic 定义

### 5.1 上行 topic（设备 -> 服务器）

| Topic | 用途 |
| --- | --- |
| edv21c/\{device\_id\}/telemetry/occupancy​ | 专门的有无人结果上报 |
| edv21c/\{device\_id\}/telemetry/status​ | 状态摘要 |
| edv21c/\{device\_id\}/telemetry/targets​ | 当前目标列表 |
| edv21c/\{device\_id\}/telemetry/zones​ | 感应区 / 屏蔽区配置快照 |
| edv21c/\{device\_id\}/telemetry/info​ | 雷达扩展信息 |
| edv21c/\{device\_id\}/telemetry/fall​ | 跌倒状态 |
| edv21c/\{device\_id\}/config/response/device​ | 控制板侧配置响应 |
| edv21c/\{device\_id\}/config/response/radar​ | 雷达侧配置响应 |
| edv21c/\{device\_id\}/control/result​ | 控制命令结果 |

### 5.2 下行 topic（服务器 -> 设备）

| Topic | 用途 |
| --- | --- |
| edv21c/\{device\_id\}/config/get/device​ | 查询控制板侧配置 |
| edv21c/\{device\_id\}/config/set/device​ | 设置控制板侧配置 |
| edv21c/\{device\_id\}/config/get/radar​ | 查询雷达侧配置 |
| edv21c/\{device\_id\}/config/set/radar​ | 设置雷达侧配置 |
| edv21c/\{device\_id\}/control/reboot​ | 重启控制命令 |
| edv21c/\{device\_id\}/control/ota​ | OTA 升级命令 |
| edv21c/\{device\_id\}/control/factory\_reset​ | 恢复出厂设置 |

### 5.3 QoS / Retain 建议

| Topic | QoS | Retain | 说明 |
| --- | --- | --- | --- |
| telemetry/occupancy​ | 0​ | 0​ | 实时有无人结果 |
| telemetry/status​ | 0​ | 0​ | 实时状态摘要 |
| telemetry/targets​ | 0​ | 0​ | 实时目标快照 |
| telemetry/zones​ | 1​ | 1​ | 区域配置快照 |
| telemetry/info​ | 1​ | 1​ | 雷达信息快照 |
| telemetry/fall​ | 0​ | 0​ | 实时跌倒状态 |
| config/response/\*​ | 1​ | 0​ | 请求响应 |
| control/result​ | 1​ | 0​ | 控制结果 |
| config/get/\*​ | 1​ | 0​ | 查询请求 |
| config/set/\*​ | 1​ | 0​ | 配置请求 |
| control/reboot​ | 1​ | 0​ | 控制请求 |
| control/ota​ | 1​ | 0​ | OTA控制请求 |
| control/factory\_reset​ | 1​ | 0​ | 恢复出厂请求 |

### 6. 上行 payload 定义

### 6.1 telemetry/status​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 时间戳，毫秒 |
| seq​ | uint32 | 数据更新序号 |
| occupied​ | bool | 当前是否检测到目标 |
| target\_count​ | uint32 | 当前目标条目数 |
| wifi\_ready​ | bool | WiFi 是否就绪 |
| mqtt\_connected​ | bool | MQTT 连接状态 |
| sw\_version​ | string | 软件版本 |
| hw\_version​ | string | 硬件版本 |
| board\_info​ | string | 板级信息 |
| work\_mode​ | uint32 | 雷达工作模式 |
| report\_period\_ms​ | uint32 | 雷达上报周期，ms |
| comm\_mode​ | uint32 | 控制板通信模式 |
| router\_ssid​ | string | 路由器 SSID |
| mqtt\_report\_period\_ms​ | uint32 | MQTT 上报周期，ms |

示例：

```json
{
  "ts_ms": 1747279000123,
  "seq": 863,
  "device_id": "a0f2629e0918",
  "occupied": true,
  "fall_state": 0,
  "target_count": 2,
  "wifi_ready": true,
  "mqtt_connected": true,
  "sw_version": "V1.3.10",
  "hw_version": "V2.0.0",
  "board_info": "EDV21C-W-V2.0",
  "work_mode": 0,
  "report_period_ms": 1000,
  "comm_mode": 0,
  "router_ssid": "easydetek-2.4G",
  "mqtt_report_period_ms": 5000
}

```

### 6.2 telemetry/occupancy​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 时间戳 |
| seq​ | uint32 | 更新序号 |
| occupied​ | bool | 当前是否有人 |
| source​ | string | 结果来源，固定为 radar​ |

说明：

1.  该 topic 专门用于上报最终有无人结果
    
2.  服务器只关心有无人状态时，优先订阅该 topic
    
3.  该 topic 不携带目标列表和区域配置
    

示例：

```json
{
  "ts_ms": 1747279000234,
  "seq": 863,
  "occupied": true,
  "source": "radar"
}

```

### 6.3 telemetry/targets​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 时间戳 |
| seq​ | uint32 | 更新序号 |
| occupied​ | bool | 当前是否有目标 |
| zone\_count​ | uint32 | 当前有结果的感应区数量 |
| zones​ | array | 按感应区分组的目标结果 |

单个感应区结果字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| zone\_id​ | uint32 | 感应区 ID |
| target\_count​ | uint32 | 当前感应区内的目标条目数 |
| targets​ | array | 当前感应区的目标列表 |

单个目标字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| target\_id​ | uint32 | 目标 ID |
| x\_mm​ | int32 | X 坐标，mm |
| y\_mm​ | int32 | Y 坐标，mm |
| z\_mm​ | int32 | Z 坐标，mm |

### 6.4 telemetry/zones​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 配置快照时间戳 |
| work\_mode​ | uint32 | 雷达工作模式 |
| report\_period\_ms​ | uint32 | 上报周期 |
| detect\_boundary​ | object | 三维检测边界 |
| sensing\_zone\_count​ | uint32 | 感应区数量 |
| sensing\_zones​ | array | 感应区列表 |
| shield\_zone\_count​ | uint32 | 屏蔽区数量 |
| shield\_zones​ | array | 屏蔽区列表 |

### 6.5 telemetry/info​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 时间戳 |
| board\_model​ | string | 设备型号 |
| sw\_version​ | string | 软件版本 |
| hw\_version​ | string | 硬件版本 |
| board\_info​ | string | 板级信息 |
| mqtt\_topic\_prefix​ | string | MQTT Topic 前缀 |
| radar\_ext\_info​ | string | 雷达扩展信息 |

### 6.6 telemetry/fall​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| ts\_ms​ | int64 | 时间戳 |
| fall\_state​ | uint32 | 0=正常​，1=疑似跌倒​，2=确认跌倒​ |

### 6.7 control/result​

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| req\_id​ | string | 请求 ID（透传） |
| ts\_ms​ | int64 | 时间戳 |
| success​ | bool | 操作是否成功 |
| action​ | string | 操作类型（reboot/ota/factory\_reset） |
| message​ | string | 结果说明 |

### 7. 下行 payload 定义

### 7.1 control/reboot​

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| req\_id​ | string | 是 | 请求 ID |
| ts\_ms​ | int64 | 是 | 时间戳 |

请求示例：

```json
{
  "req_id": "reboot-001",
  "ts_ms": 1747279005000
}

```

响应（control/result​）：

```json
{
  "req_id": "reboot-001",
  "ts_ms": 1747279005100,
  "success": true,
  "action": "reboot",
  "message": "restarting"
}

```

### 7.2 control/ota​

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| req\_id​ | string | 是 | 请求 ID |
| ts\_ms​ | int64 | 是 | 时间戳 |
| firmware\_url​ | string | 否 | 固件下载 URL（直接下发时使用） |

请求示例：

```json
{
  "req_id": "ota-001",
  "ts_ms": 1747279006000
}

```

### 7.3 control/factory\_reset​

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| req\_id​ | string | 是 | 请求 ID |
| ts\_ms​ | int64 | 是 | 时间戳 |

说明：

1.  设备收到后立即响应 control/result​（success=true, action=factory\_reset）
    
2.  随后执行：雷达复位 → IOT 复位 → 擦除 NVS → 重启
    
3.  重启后所有参数恢复出厂默认值
    

请求示例：

```json
{
  "req_id": "factory-reset-001",
  "ts_ms": 1747279007000
}

```

响应（control/result​）：

```json
{
  "req_id": "factory-reset-001",
  "ts_ms": 1747279007100,
  "success": true,
  "action": "factory_reset",
  "message": "resetting"
}

```

:::info 规格书
完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz)获取，或联系 support@easydetek.com。
:::
