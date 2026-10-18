---
title: "EDV25P MQTT 协议说明"
sidebar_position: 3
---

# EDV25P MQTT 协议说明

> 本协议定义 EDV25P 的 MQTT 通信：设备上行遥测（`status`、`occupancy`、`targets`、`zones`、`info`、`fall`）、服务器下行配置读取与设置（`config/get/radar`、`config/set/radar`）以及控制命令（`control/reboot`）。数据格式 JSON，topic 前缀 `edv25p/{device_id}/`。整理自钉钉知识库《EDV25P-MQTT协议说明》。

:::caution 适用型号待确认
本文档的网络层为 **Wi-Fi STA**，而《EDV25P 系列规格书》附录 A.1 声明的系列版本仅有三个：EDV25P-4（RS485 总线）、EDV25P-K（KNX 总线）、EDV25P-T（涂鸦 Zigbee），其中**不包含 Wi-Fi 版本**。本文档与上述三个版本的对应关系**待产品团队确认**，请勿据此推断适用型号；对接前请与销售或 FAE 确认实际适用产品。
:::

## 1. 适用范围

本文档定义 EDV25P 的 MQTT 通信协议，包括：

1. 设备上行状态与目标数据上报
2. 服务器下行配置读取与设置
3. 控制类命令

MQTT 使用单个客户端连接同时完成发布与订阅。

## 2. 协议概述

| 项目 | 说明 |
| --- | --- |
| 网络层 | Wi-Fi STA |
| 传输层 | TCP |
| 应用层 | MQTT 3.1.1 |
| 设备角色 | MQTT Client |
| 数据格式 | JSON |
| topic 前缀 | `edv25p/{device_id}/` |
| 服务器端口 | `1883` |
| 心跳 keepalive | `30` 秒 |
| 会话 | Clean Session |

说明：

1. 当前实现为明文 TCP 传输，不使用 TLS。
2. 单连接同时完成发布与订阅。
3. topic 前缀固定为 `edv25p/{device_id}/`，设备在 `telemetry/radar/info` 的 `mqtt_topic_prefix` 字段回传当前生效值。

## 3. 设备标识规则

本协议 topic 中的 `{device_id}` 表示设备标识。

设备标识取设备 Wi-Fi STA MAC，转换为 12 位小写十六进制字符串，不带分隔符。

示例：

```text
84f70312ab56
```

完整 topic 前缀示例：

```text
edv25p/84f70312ab56/
```

上行 payload 中同样携带 `device_id` 字段，取值与上述规则一致。

## 4. 连接与运行约束

设备满足以下条件时，才建立 MQTT 连接：

1. 已启用 MQTT 功能
2. 已完成路由器 Wi-Fi 名称配置且已连接
3. 已完成 MQTT 服务器地址配置
4. 已完成 MQTT 服务器端口配置

说明：

1. 上述任一条件不满足时，设备不建立连接
2. MQTT 功能关闭时，设备断开已有连接并停止周期上报
3. MQTT 连接建立成功后，设备立即发布一次全量快照，依次为 `status`、`occupancy`、`targets`、`zones`、`info`、`fall`

## 5. Topic 定义

### 5.1 上行 topic（设备 -> 服务器）

| Topic | 用途 |
| --- | --- |
| `edv25p/{device_id}/telemetry/radar/occupancy` | 专门的有无人结果上报 |
| `edv25p/{device_id}/telemetry/radar/status` | 状态摘要 |
| `edv25p/{device_id}/telemetry/radar/targets` | 当前目标列表 |
| `edv25p/{device_id}/telemetry/radar/zones` | 感应区 / 屏蔽区配置快照 |
| `edv25p/{device_id}/telemetry/radar/info` | 雷达扩展信息 |
| `edv25p/{device_id}/telemetry/radar/fall` | 跌倒状态 |
| `edv25p/{device_id}/config/response/radar` | 雷达侧配置响应 |
| `edv25p/{device_id}/control/result` | 控制命令结果 |

### 5.2 下行 topic（服务器 -> 设备）

| Topic | 用途 |
| --- | --- |
| `edv25p/{device_id}/config/get/radar` | 查询雷达侧配置 |
| `edv25p/{device_id}/config/set/radar` | 设置雷达侧配置 |
| `edv25p/{device_id}/cmd/get_config` | 触发一次全量快照上报 |
| `edv25p/{device_id}/cmd/set_config` | 设置雷达侧配置（与 `config/set/radar` 等价）|
| `edv25p/{device_id}/control/reboot` | 重启控制命令 |

### 5.3 QoS / Retain

| Topic | QoS | Retain | 说明 |
| --- | --- | --- | --- |
| `telemetry/radar/occupancy` | `0` | `0` | 实时有无人结果 |
| `telemetry/radar/status` | `0` | `0` | 实时状态摘要 |
| `telemetry/radar/targets` | `0` | `0` | 实时目标快照 |
| `telemetry/radar/zones` | `1` | `1` | 区域配置快照 |
| `telemetry/radar/info` | `1` | `1` | 雷达信息快照 |
| `telemetry/radar/fall` | `0` | `0` | 实时跌倒状态 |
| `config/response/radar` | `1` | `0` | 请求响应 |
| `control/result` | `1` | `0` | 控制结果 |
| `config/get/radar` | `1` | `0` | 查询请求 |
| `config/set/radar` | `1` | `0` | 配置请求 |
| `cmd/get_config` | `1` | `0` | 快照触发请求 |
| `cmd/set_config` | `1` | `0` | 配置请求 |
| `control/reboot` | `1` | `0` | 控制请求 |

## 6. 上行 payload 定义

所有上行 payload 均携带 `ts_ms`、`seq`、`device_id` 三个公共字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳，毫秒 |
| `seq` | uint32 | 数据更新序号 |
| `device_id` | string | 设备标识，见第 3 节 |

### 6.1 `telemetry/radar/status`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳，毫秒 |
| `seq` | uint32 | 数据更新序号 |
| `device_id` | string | 设备标识 |
| `occupied` | bool | 当前是否检测到目标 |
| `fall_state` | uint32 | `0=正常`，`1=跌倒` |
| `target_count` | uint32 | 当前目标条目数 |
| `wifi_ready` | bool | Wi-Fi 是否已连接 |
| `mqtt_connected` | bool | MQTT 连接状态 |
| `work_mode` | uint32 | 雷达业务工作模式，读取失败时该字段不出现 |
| `report_period_ms` | uint32 | 雷达上报周期，读取失败时该字段不出现 |
| `mqtt_report_period_ms` | uint32 | MQTT 上报周期，读取失败时该字段不出现 |
| `router_ssid` | string | 当前路由器 SSID |

说明：

1. `work_mode`、`report_period_ms`、`mqtt_report_period_ms` 为条件字段，读取失败时不出现在 payload 中，服务器解析时应做缺省容错
2. 该 topic 与 `occupancy` 一起作为周期上报内容

示例：

```json
{
  "ts_ms": 1747279000123,
  "seq": 863,
  "device_id": "84f70312ab56",
  "occupied": true,
  "fall_state": 0,
  "target_count": 2,
  "wifi_ready": true,
  "mqtt_connected": true,
  "work_mode": 1,
  "report_period_ms": 500,
  "mqtt_report_period_ms": 60000,
  "router_ssid": "RadarAP"
}
```

### 6.2 `telemetry/radar/occupancy`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳 |
| `seq` | uint32 | 更新序号 |
| `device_id` | string | 设备标识 |
| `occupied` | bool | 当前是否有人 |
| `source` | string | 结果来源，固定为 `radar` |

说明：

1. 该 topic 专门用于上报最终有无人结果
2. 服务器只关心有无人状态时，优先订阅该 topic
3. 该 topic 不携带目标列表和区域配置

示例：

```json
{
  "ts_ms": 1747279000234,
  "seq": 863,
  "device_id": "84f70312ab56",
  "occupied": true,
  "source": "radar"
}
```

### 6.3 `telemetry/radar/targets`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳 |
| `seq` | uint32 | 更新序号 |
| `device_id` | string | 设备标识 |
| `zones` | array | 按感应区分组的目标结果 |
| `target_count` | uint32 | 全部感应区的目标条目总数 |

单个感应区结果字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `zone_id` | uint32 | 感应区 ID |
| `target_count` | uint32 | 当前感应区内的目标条目数 |
| `targets` | array | 当前感应区的目标列表 |

单个目标字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `target_id` | uint32 | 目标 ID |
| `x_mm` | int32 | X 坐标，mm |
| `y_mm` | int32 | Y 坐标，mm |
| `z_mm` | uint32 | Z 坐标，mm |
| `speed` | uint32 | 目标速度 |

说明：

1. topic 不按感应区拆分，payload 按感应区分组
2. 感应区允许重叠
3. 不定义总人数
4. 同一物理目标可同时出现在多个 `zone_id` 中
5. `target_count` 表示当前感应区内的目标条目数；顶层 `target_count` 表示全部感应区目标条目总数
6. 顶层 `target_count` 位于 `zones` 数组之后，解析时不应假定键顺序
7. 该 topic 不参与连接建立时的全量快照，也不做数值去重，每次收到目标数据即发布一次
8. 无目标数据时 payload 为 `{"ts_ms":...,"seq":...,"device_id":"...","zones":[],"target_count":0}`

示例：

```json
{
  "ts_ms": 1747279000456,
  "seq": 864,
  "device_id": "84f70312ab56",
  "zones": [
    {
      "zone_id": 1,
      "target_count": 2,
      "targets": [
        {
          "target_id": 1,
          "x_mm": 100,
          "y_mm": 2000,
          "z_mm": 900,
          "speed": 0
        },
        {
          "target_id": 2,
          "x_mm": -300,
          "y_mm": 1800,
          "z_mm": 950,
          "speed": 12
        }
      ]
    },
    {
      "zone_id": 2,
      "target_count": 1,
      "targets": [
        {
          "target_id": 3,
          "x_mm": 1200,
          "y_mm": 2600,
          "z_mm": 880,
          "speed": 5
        }
      ]
    }
  ],
  "target_count": 3
}
```

### 6.4 `telemetry/radar/zones`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 配置快照时间戳 |
| `seq` | uint32 | 更新序号 |
| `device_id` | string | 设备标识 |
| `work_mode` | uint32 | 雷达业务工作模式，读取失败时为 `null` |
| `report_period_ms` | uint32 | 雷达上报周期，读取失败时为 `null` |
| `mqtt_report_period_ms` | uint32 | MQTT 上报周期，读取失败时为 `null` |
| `detect_boundary` | object | 总体三维检测区域，读取失败时为 `null` |
| `sensing_zone_count` | uint32 | 感应区数量，读取失败时为 `0` |
| `sensing_zones` | array | 感应区列表，读取失败时为 `[]` |
| `shield_zone_count` | uint32 | 屏蔽区数量，读取失败时为 `0` |
| `shield_zones` | array | 屏蔽区列表，读取失败时为 `[]` |

单个区域字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `zone_id` | uint32 | 区域 ID（`detect_boundary` 无此字段）|
| `x_min` | int32 | X 最小值，mm |
| `x_max` | int32 | X 最大值，mm |
| `y_min` | int32 | Y 最小值，mm |
| `y_max` | int32 | Y 最大值，mm |
| `z_min` | uint32 | Z 最小值，mm |
| `z_max` | uint32 | Z 最大值，mm |

示例：

```json
{
  "ts_ms": 1747279000500,
  "seq": 865,
  "device_id": "84f70312ab56",
  "work_mode": 1,
  "report_period_ms": 500,
  "mqtt_report_period_ms": 60000,
  "detect_boundary": {
    "x_min": -3000,
    "x_max": 3000,
    "y_min": 0,
    "y_max": 5000,
    "z_min": 0,
    "z_max": 3000
  },
  "sensing_zone_count": 1,
  "sensing_zones": [
    {
      "zone_id": 1,
      "x_min": -3000,
      "x_max": 3000,
      "y_min": 0,
      "y_max": 5000,
      "z_min": 0,
      "z_max": 3000
    }
  ],
  "shield_zone_count": 0,
  "shield_zones": []
}
```

### 6.5 `telemetry/radar/info`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳 |
| `seq` | uint32 | 更新序号 |
| `device_id` | string | 设备标识 |
| `board_model` | string | 板型名称 |
| `sw_version` | string | 固件软件版本 |
| `hw_version` | string | 硬件版本 |
| `mqtt_topic_prefix` | string | 当前生效的 MQTT topic 前缀 |
| `radar_ext_info` | string | 雷达扩展信息，读取失败时该字段不出现 |

示例：

```json
{
  "ts_ms": 1747279000600,
  "seq": 866,
  "device_id": "84f70312ab56",
  "board_model": "EDV25P-Y-BL02",
  "sw_version": "V2.3.4",
  "hw_version": "V1.0",
  "mqtt_topic_prefix": "edv25p/84f70312ab56",
  "radar_ext_info": "EDV11P_V1.2.3"
}
```

### 6.6 `telemetry/radar/fall`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts_ms` | int64 | 时间戳 |
| `seq` | uint32 | 更新序号 |
| `device_id` | string | 设备标识 |
| `fall_state` | uint32 | `0=正常`，`1=跌倒` |

示例：

```json
{
  "ts_ms": 1747279000700,
  "seq": 867,
  "device_id": "84f70312ab56",
  "fall_state": 1
}
```

### 6.7 `config/response/radar`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `req_id` | string | 原请求 ID，请求未携带时为空串 |
| `ts_ms` | int64 | 响应时间戳 |
| `success` | bool | 是否成功 |
| `message` | string | 结果说明，成功时为 `ok` |
| `config` | object | 操作后的雷达配置全量快照 |

说明：

1. 无论成功或失败，`config` 都返回当前雷达配置全量快照
2. 设置成功后，设备额外主动发布一次 `telemetry/radar/zones`

示例：

```json
{
  "req_id": "set-radar-001",
  "ts_ms": 1747279000800,
  "success": true,
  "message": "ok",
  "config": {
    "work_mode": 1,
    "report_period_ms": 500,
    "mqtt_report_period_ms": 60000,
    "detect_boundary": {
      "x_min": -3000,
      "x_max": 3000,
      "y_min": 0,
      "y_max": 5000,
      "z_min": 0,
      "z_max": 3000
    },
    "sensing_zone_count": 1,
    "sensing_zones": [
      {
        "zone_id": 1,
        "x_min": -3000,
        "x_max": 3000,
        "y_min": 0,
        "y_max": 5000,
        "z_min": 0,
        "z_max": 3000
      }
    ],
    "shield_zone_count": 0,
    "shield_zones": []
  }
}
```

### 6.8 `control/result`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `req_id` | string | 原请求 ID |
| `ts_ms` | int64 | 响应时间戳 |
| `success` | bool | 是否成功 |
| `action` | string | 固定为 `reboot` |
| `message` | string | 结果说明，成功时为 `restarting` |

示例：

```json
{
  "req_id": "reboot-001",
  "ts_ms": 1747279001000,
  "success": true,
  "action": "reboot",
  "message": "restarting"
}
```

## 7. 下行 payload 定义

### 7.1 通用字段

所有下行请求统一使用以下基础字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `req_id` | string | 请求唯一标识，响应中回填 |
| `ts_ms` | int64 | 请求时间戳 |

说明：

1. 两个字段均为可选，缺失不影响命令执行
2. 请求 payload 必须为合法 JSON 对象，非法时返回 `success=false`、`message="invalid json"`
3. 请求 payload 长度上限 4096 字节，超出部分会被截断后解析
4. 请求 payload 的 JSON token 数上限 256，超限导致解析失败并返回 `success=false`
5. `req_id` 超长会被截断，建议控制在 64 字节以内

### 7.2 `config/get/radar`

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| `req_id` | string | 否 | 请求 ID |
| `ts_ms` | int64 | 否 | 时间戳 |

说明：

1. 查询始终返回全量雷达配置，不支持按字段筛选
2. 响应报文见 6.7

请求示例：

```json
{
  "req_id": "get-radar-001",
  "ts_ms": 1747279001000
}
```

### 7.3 `config/set/radar`

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| `req_id` | string | 否 | 请求 ID |
| `ts_ms` | int64 | 否 | 时间戳 |
| `config` | object | 是 | 待写入配置 |

写入雷达配置时，`config` 对象支持以下 JSON 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `work_mode` | uint32 | 雷达业务工作模式 |
| `report_period_ms` | uint32 | 雷达上报周期，单位毫秒，取值 0~65535 |
| `detect_boundary` | object | 总体三维检测区域 |
| `sensing_zones` | array | 感应区列表，整表下发，替换现有全部感应区 |
| `shield_zones` | array | 屏蔽区列表，整表下发，替换现有全部屏蔽区 |

区域对象统一使用以下 JSON 字段名：

- `zone_id`
- `x_min`
- `x_max`
- `y_min`
- `y_max`
- `z_min`
- `z_max`

说明：

1. 支持部分字段写入，未出现字段保持原值
2. `sensing_zone_count`、`shield_zone_count` 不接受下发，数量由数组长度自动推导
3. 雷达配置写入成功后应立即转发到雷达并生效，并进入持久化
4. 不再定义独立的配置生效 topic
5. 响应报文见 6.7

请求示例：

```json
{
  "req_id": "set-radar-001",
  "ts_ms": 1747279002000,
  "config": {
    "work_mode": 1,
    "report_period_ms": 500,
    "detect_boundary": {
      "x_min": -3000,
      "x_max": 3000,
      "y_min": 0,
      "y_max": 5000,
      "z_min": 0,
      "z_max": 3000
    },
    "sensing_zones": [
      {
        "zone_id": 1,
        "x_min": -3000,
        "x_max": 3000,
        "y_min": 0,
        "y_max": 5000,
        "z_min": 0,
        "z_max": 3000
      }
    ],
    "shield_zones": []
  }
}
```

### 7.4 `cmd/get_config`

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| `req_id` | string | 否 | 请求 ID |

说明：

1. 触发一次全量快照上报，设备依次发布 `telemetry/radar/info`、`telemetry/radar/zones`、`telemetry/radar/status`
2. 该命令只发布上述三个 topic，与连接建立时的六条快照范围不同

请求示例：

```json
{
  "req_id": "get-config-001"
}
```

### 7.5 `cmd/set_config`

与 `config/set/radar` 语义完全一致，使用同一处理逻辑，请求体格式同 7.3，用于兼容旧版服务器实现。

### 7.6 `control/reboot`

请求字段：

| 字段 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| `req_id` | string | 否 | 请求 ID |
| `ts_ms` | int64 | 否 | 时间戳 |
| `action` | string | 是 | 固定为 `reboot` |

说明：`action` 取值不是 `reboot` 时命令不执行。

请求示例：

```json
{
  "req_id": "reboot-001",
  "ts_ms": 1747279005000,
  "action": "reboot"
}
```
