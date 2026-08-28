---
title: "EDV28A"
sidebar_position: 1
---

# EDV28A

> 实时探测胸腔毫米级微动，智能监测睡眠阶段，智能识别异常呼吸或心率｜60GHz 独立传感器｜🔧 研发测试

## 核心特点

实时探测胸腔毫米级微动，智能监测睡眠阶段，智能识别异常呼吸或心率

## 规格参数

| 参数 | 规格 |
|------|------|
| 工作频段 | 60GHz |
| 感应方式 | 毫米波 |
| 输入电压 | DC 5V |
| 输出方式 | Cat1 |
| 调参方式 | Cat1 |
| 安装方式 | 卡扣 |
| 产品状态 | 研发测试 |

## 相关 FAQ

- [如何选择频段](/docs/faq/模组选型/frequency-selection)
- [安装注意事项](/docs/faq/通用问题/installation)
- [供电与接线](/docs/faq/通用问题/power-wiring)

## MQTT 对接文档

> 本节定义 EDV28A 呼吸睡眠监测设备接入 EasyDetek 平台的完整 MQTT 通信协议，供第三方设备端对接使用。设备类型标识 `edv28a`，Topic 前缀 `radar/edv28a/{device_id}/`。客户自建服务器对接指南见第 6 章。

**设备类型标识 (device_type)**: `edv28a`

本文档定义 EDV28A 呼吸睡眠监测设备接入 EasyDetek 平台的完整 MQTT 通信协议，供第三方设备端对接使用。所有主题、字段、取值均与平台服务端当前实现一致，设备端需严格按照本文档实现。

若客户不使用 EasyDetek 云端服务、自行搭建 MQTT 服务端，请参照 **第 6 章《客户自建 MQTT 服务器对接指南》** 完成 Broker 部署与服务端应用开发，设备侧通信协议不变。

---

### 1. MQTT 连接信息

| 项目 | 说明 |
| :--- | :--- |
| Broker | EMQX（地址与端口以对接分配信息为准，默认 TCP `1883`） |
| 协议版本 | MQTT 3.1.1 / 5.0 |
| 鉴权方式 | 账号密码认证（Username/Password） |
| Username | `REDACTED` |
| Password | `REDACTED` |
| Keep Alive | 建议 60 秒 |
| Client ID | 设备端自行生成，需保证全局唯一（建议用 device_id） |
| QoS | 平台所有收发消息均使用 **QoS 1（AtLeastOnce）**，Retain 均为 `false` |
| Payload 格式 | UTF-8 编码的 JSON 字符串（`Content-Type: application/json` 语义） |

> **离线判定规则**：平台收到设备任何一条消息（`data`/`report`/`status`/`getSetting`/`getOta`/`otaProcess`/`resInfo`）即刷新该设备心跳；**连续 90 秒**未收到任何消息，设备将被判定为离线。请确保心跳类消息周期小于 90 秒。

---

### 2. 通信主题 (Topics) 总览

`{device_id}` 为设备唯一标识（如 4G 模组 IMEI：`867920075014440`）。

#### 2.1 设备 → 云端（设备需发布）

| # | 用途 | Topic | 触发时机 |
| :--- | :--- | :--- | :--- |
| 1 | 实时数据/告警上报 | `radar/edv28a/{device_id}/data` | 按 `report_interval` 周期上报（默认 5 秒） |
| 2 | 睡眠报告上报 | `radar/edv28a/{device_id}/report` | 判定睡眠结束后上报一次 |
| 3 | 上线状态上报 | `radar/edv28a/{device_id}/status` | 设备连接 MQTT 成功后上报（可携带信号质量） |
| 4 | 请求配置下发 | `radar/edv28a/{device_id}/getSetting` | 设备启动/需要同步配置时上报 |
| 5 | 请求 OTA 固件 | `radar/edv28a/{device_id}/getOta` | 设备启动/检查更新时上报 |
| 6 | OTA 进度上报 | `radar/edv28a/{device_id}/otaProcess` | OTA 升级过程中上报 |
| 7 | 设备版本信息上报 | `radar/edv28a/{device_id}/resInfo` | 设备启动时上报 |
| 8 | 配置回执 | `radar/edv28a/{device_id}/config/ack` | 收到并处理 `config/set` 后回复 |

#### 2.2 云端 → 设备（设备需订阅）

| # | 用途 | Topic | 说明 |
| :--- | :--- | :--- | :--- |
| 1 | 配置下发 | `radar/edv28a/{device_id}/config/set` | 完整配置参数（见 4.1） |
| 2 | OTA 响应 | `radar/edv28a/{device_id}/otaRes` | 固件下载地址（见 4.8） |
| 3 | 版本信息响应 | `radar/edv28a/{device_id}/resInfo/ack` | 通知版本信息是否已受理（见 4.10） |

---

### 3. 消息时序（推荐上电流程）

```
设备                                      云端(EMQX)
 │── MQTT CONNECT (鉴权) ────────────────────▶│
 │◀──────────────── CONNACK ─────────────────│
 │                                           │
 │── SUBSCRIBE config/set, otaRes, ─────────▶│
 │          resInfo/ack                      │
 │                                           │
 │── radar/edv28a/{id}/status ──────────────▶│  上线+信号质量
 │── radar/edv28a/{id}/resInfo ─────────────▶│  版本信息
 │◀─ radar/edv28a/{id}/resInfo/ack ──────────│
 │── radar/edv28a/{id}/getSetting ──────────▶│  请求配置
 │◀─ radar/edv28a/{device_id}/config/set ────│  下发配置
 │── radar/edv28a/{id}/config/ack ──────────▶│  必须回执!
 │                                           │
 │── radar/edv28a/{id}/data ────────────────▶│  周期上报(默认5s)
 │   ...                                     │
 │                                           │
 │── radar/edv28a/{id}/getOta ──────────────▶│  (可选)检查固件
 │◀─ radar/edv28a/{id}/otaRes ───────────────│  下载地址/无更新
 │── otaProcess(type=0) ────────────────────▶│  开始升级
 │── otaProcess(type=1) ────────────────────▶│  升级结束
```

---

### 4. 数据格式定义 (JSON Payload)

#### 4.1 配置下发（云端 → 设备）

* **Topic**: `radar/edv28a/{device_id}/config/set`
* **QoS 1，retain=false，平铺 JSON 结构（非嵌套）**

```json
{
  "device_id": "867920075014440",
  "device_name": "卧室雷达",
  "time_zone": 8,
  "interest_sleep_start_time": 0,
  "interest_sleep_end_time": 480,
  "report_interval": 5,
  "detect_range_min": 20,
  "detect_range_max": 80,
  "hr_high": 120,
  "hr_low": 50,
  "rr_high": 40,
  "rr_low": 10,
  "apnea_sec": 30,
  "no_vital_sec": 10
}
```

**字段说明：**

| 字段 | 类型 | 含义 | 默认值 |
| :--- | :--- | :--- | :--- |
| `device_id` | String | 设备唯一标识 | - |
| `device_name` | String | 设备名称 | - |
| `time_zone` | Number | 时区（小时） | 8 |
| `interest_sleep_start_time` | Number | 关注睡眠时段开始（**分钟数**，0 = 00:00） | 0 |
| `interest_sleep_end_time` | Number | 关注睡眠时段结束（分钟数，480 = 08:00） | 480 |
| `report_interval` | Number | 实时数据上报周期（秒） | 5 |
| `detect_range_min` | Number | 检测距离下限（厘米） | 20 |
| `detect_range_max` | Number | 检测距离上限（厘米） | 80 |
| `hr_high` / `hr_low` | Number | 心率告警上限/下限（bpm） | 120 / 50 |
| `rr_high` / `rr_low` | Number | 呼吸率告警上限/下限（rpm） | 40 / 10 |
| `apnea_sec` | Number | 呼吸暂停判定时长（秒） | 30 |
| `no_vital_sec` | Number | 无生命体征判定时长（秒） | 10 |

#### 4.2 配置回执（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/config/ack`
* **重要**：`result` 仅识别 `success` 和 `fail` 两个取值（其他值按失败处理）

```json
{
  "result": "success",
  "msg": "Config updated"
}
```

```json
{
  "result": "fail",
  "msg": "invalid parameter: hr_high"
}
```

> 平台在 Web 端保存设置后会同步下发配置并**等待 30 秒**回执：收到 `success` 才向用户返回"设置成功"，超时或 `fail` 均返回失败。

#### 4.3 实时数据上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/data`
* **频率**：按 `report_interval` 配置周期上报（默认 5 秒/次）

```json
{
  "presence": 1,
  "movement": 0,
  "heart_rate": 75,
  "breath_rate": 18,
  "sleep_state": 2,
  "breath_state": 0,
  "heart_state": 0,
  "distance": 0.5,
  "credibility": 90,
  "heart_confidence": 85,
  "breath_confidence": 88
}
```

**字段说明：**

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `presence` | Number | 在位状态：0-离位，1-在位 |
| `movement` | Number | 体动状态：0-静止，1-体动 |
| `heart_rate` | Number | 心率（bpm），未检测到时为 0 |
| `breath_rate` | Number | 呼吸率（rpm），未检测到时为 0 |
| `sleep_state` | Number | 睡眠状态（枚举见下表） |
| `breath_state` | Number | 呼吸状态：0-正常，1-过慢，2-过快，3-快速上升，4-呼吸暂停 |
| `heart_state` | Number | 心率状态 |
| `distance` | Number | (可选) 目标距离，单位：米 |
| `credibility` | Number | (可选) 综合可信度 |
| `heart_confidence` | Number | (可选) 心率置信度 |
| `breath_confidence` | Number | (可选) 呼吸置信度 |

**sleep_state 枚举：**

| 值 | 含义 |
| :--- | :--- |
| 0 | 离床（无人） |
| 1 | 清醒 |
| 2 | REM |
| 3 | 浅睡 |
| 4 | 深睡 |
| 5 | 翻身/体动 |
| 6 | 入睡 |

> **类型校验（重要）**：上述数值字段必须为 JSON 整数（或可解析为整数的字符串）。`distance` 可为浮点数。若字段类型不合法，平台将**丢弃整条消息**并记录错误日志。

#### 4.4 告警事件上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/data`（与实时数据**同一主题**，通过字段区分：包含 `type` + `value` 即识别为告警事件）
* **触发条件**：监测值超过 `config/set` 下发的阈值时立即上报

```json
{
  "type": "heart_rate_high",
  "value": 130,
  "threshold": 120,
  "timestamp": 1702030000
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `type` | String | 告警类型枚举 |
| `value` | Number | 触发告警时的当前值 |
| `threshold` | Number | 触发告警的阈值 |
| `timestamp` | Number | 事件发生的时间戳（Unix 秒） |

**告警类型枚举（`type`）**：`heart_rate_high`（心率过高）、`heart_rate_low`（心率过低）、`breath_rate_high`（呼吸率过高）、`breath_rate_low`（呼吸率过低）、`apnea`（呼吸暂停）、`no_vital_signs`（无生命体征）、`out_of_bed_timeout`（离位超时）

#### 4.5 睡眠报告上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/report`
* **触发条件**：判定用户起床、整段睡眠结束后上报一次

```json
{
  "start_time": 1702000000,
  "end_time": 1702030000,
  "duration_sleep": 480,
  "score": 85,
  "efficiency": 92,
  "latency_sleep": 15,
  "count_awake": 2,
  "percentage_light_sleep": 45,
  "percentage_rem": 20,
  "percentage_deep_sleep": 25,
  "fragment_index": 8,
  "abnormal": 0,
  "apnea_count": 3
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `start_time` | Number | 入睡时间戳（Unix 秒） |
| `end_time` | Number | 起床时间戳（Unix 秒） |
| `duration_sleep` | Number | 总睡眠时长（分钟） |
| `score` | Number | 睡眠质量评分（0-100） |
| `efficiency` | Number | 睡眠效率（0-100） |
| `latency_sleep` | Number | 入睡潜伏期（分钟） |
| `count_awake` | Number | 清醒次数 |
| `percentage_light_sleep` | Number | 浅睡占比（%） |
| `percentage_rem` | Number | REM 占比（%） |
| `percentage_deep_sleep` | Number | 深睡占比（%） |
| `fragment_index` | Number | 睡眠碎片化指数 |
| `abnormal` | Number | 异常标记：0-正常，1-异常 |
| `apnea_count` | Number | 呼吸暂停次数（可省略，默认 0） |

> **注意**：除 `apnea_count` 外所有字段均为**必填**，缺失或类型错误将导致 JSON 解析失败、报告不入库。

#### 4.6 上线状态上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/status`
* **触发条件**：设备 MQTT 连接成功后立即上报；建议每 60 秒上报一次作为心跳

```json
{
  "csq": 31
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `csq` | Number | (可选) 网络信号质量（0-31，越大越好） |

收到此消息平台将设备标记为**在线**，并将 `csq` 透传至前端展示。Payload 也可为空 JSON `{}`。

#### 4.7 请求配置下发（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/getSetting`
* **触发条件**：设备启动完成、或需要主动同步配置时上报（Payload 可为空）

平台收到后查询数据库中的当前配置，通过 `config/set`（格式见 4.1）回复。若平台无该设备的配置记录则不回复。

#### 4.8 OTA 固件请求与响应

**设备请求（设备 → 云端）**

* **Topic**: `radar/edv28a/{device_id}/getOta`

```json
{
  "moduleType": "EDV151"
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `moduleType` | String | **必填**，模组类型（如 `EDV151`），用于匹配固件 |

**云端响应（云端 → 设备）**

* **Topic**: `radar/edv28a/{device_id}/otaRes`

有可用固件时：

```json
{
  "status": "succse",
  "filename": "EDV28A-EDV151-cust_v160-ota-0x64B3A57B.bin",
  "ossUrl": "https://www.example.com/firmware/xxx.bin"
}
```

无可用固件或参数错误时：

```json
{
  "status": "error",
  "error": "moduleType is required for OTA"
}
```

> **⚠️ 特别注意**：成功状态的字段值为 `succse`（历史拼写，非 `success`），设备端判断时必须按此字面值匹配。

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `status` | String | `succse`=有固件可下载；`error`=无固件/参数错误 |
| `filename` | String | 固件文件名（含 CRC32 校验码，如 `0x64B3A57B`） |
| `ossUrl` | String | 固件下载地址（HTTP GET） |

#### 4.9 OTA 进度上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/otaProcess`

```json
{
  "otaStatus": "downloading",
  "type": 0,
  "process": "35",
  "cat1_version": "v1.2.3",
  "radar_version": "cust_v160",
  "radar_uuid": "A1B2C3D4"
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `otaStatus` | String | 当前升级状态（如 `waiting`/`downloading`/`success`/`fail`） |
| `type` | Number | 消息类型：**0-开始升级，1-升级结束，2-异常结束**（必为整数或整数字符串） |
| `process` | Number/String | 进度（如 `35` 表示 35%） |
| `cat1_version` | Number/String | (可选) 4G 模组版本，升级结束时上报 |
| `radar_version` | Number/String | (可选) 雷达固件版本，升级结束时上报 |
| `radar_uuid` | Number/String | (可选) 雷达 UUID，升级结束时上报 |

`type=1`（升级结束）时，平台将 `cat1_version`/`radar_version`/`radar_uuid` 写入设备记录，并归档本次升级记录。

#### 4.10 设备版本信息上报（设备 → 云端）

* **Topic**: `radar/edv28a/{device_id}/resInfo`
* **触发条件**：设备启动时上报

```json
{
  "cat1_version": "v1.2.3",
  "radar_version": "cust_v160",
  "radar_uuid": "A1B2C3D4"
}
```

| 字段 | 类型 | 含义 |
| :--- | :--- | :--- |
| `cat1_version` | Number/String | 4G 模组（CAT1）固件版本 |
| `radar_version` | Number/String | 雷达算法固件版本 |
| `radar_uuid` | Number/String | 雷达 UUID |

**云端响应（云端 → 设备）**

* **Topic**: `radar/edv28a/{device_id}/resInfo/ack`

```json
{ "msg": "ok", "code": "1" }
```

```json
{ "msg": "fail", "code": "0" }
```

---

### 5. 对接注意事项汇总

1. **QoS 与 Retain**：全部消息 QoS 1、Retain=false，设备端按此设置发布与订阅。
2. **心跳保活**：EDV28A 离线阈值为 90 秒，确保周期性消息（`data`/`status`）间隔 < 90 秒。
3. **配置必须回执**：收到 `config/set` 后务必在 **30 秒内** 回复 `config/ack`，否则平台向用户返回"配置设备失败"。
4. **`config/ack` 取值**：`result` 仅认 `success` / `fail`。
5. **`otaRes` 成功状态字面值**：`succse`（历史拼写，勿纠正为 `success`）。
6. **数值字段类型**：`data` 主题的数值字段必须是整数（`distance` 可为浮点）；`report` 主题字段缺失会导致报告被丢弃。
7. **告警与实时数据同主题**：告警事件通过 `data` 主题上报，靠 `type`+`value` 字段区分，平台**没有**独立的 `alert` 主题。
8. **建议启动顺序**：`status` → `resInfo` → `getSetting` → 周期 `data`；OTA 按需触发 `getOta`。

---

### 6. 附录：客户自建 MQTT 服务器对接指南

如果客户不使用 EasyDetek 云端服务，而是自行搭建服务端，需要完成两部分工作：**① 部署一个 MQTT Broker；② 开发服务端应用程序**（替代 EasyDetek 服务端处理设备消息并作出响应）。设备端无需修改协议，只需将设备内置的 MQTT 服务器地址、端口、账号更新为客户自建服务的信息（配置方式请联系设备供应商）。

#### 6.1 整体架构

```
EDV28A 设备 ── MQTT(TCP 1883, 账号鉴权) ──▶ 客户自建 MQTT Broker
                                                 │
                                                 │ 订阅/发布（本机或内网）
                                                 ▼
                                          客户自建服务端应用
                                          （响应 getSetting/getOta/resInfo，
                                            接收 data/report/status，
                                            自行决定存储与业务逻辑）
```

#### 6.2 MQTT Broker 部署要求

无论选用哪种 Broker（EMQX / Mosquitto / RabbitMQ-MQTT 等），需满足以下通用要求：

| 项目 | 要求 |
| :--- | :--- |
| 协议版本 | MQTT 3.1.1 或 5.0 |
| 监听端口 | TCP `1883`（设备端按此对接；如客户改用其他端口，需同步告知设备侧配置） |
| 鉴权 | **必须开启**账号密码认证（Username/Password），禁止匿名接入 |
| QoS | 支持 QoS 1（设备全部消息使用 QoS 1 收发） |
| Keep Alive | 支持 60 秒心跳（1.5 倍超时断开，即 90 秒） |
| 会话 | 建议开启持久会话/消息队列，设备短暂断线重连期间（QoS1）不丢下发消息 |
| TLS | 可选。如需启用，使用 TCP 8883（标准 TLS 端口），证书需提前注入设备 |
| 容量参考 | 单设备消息频率约 0.2 条/秒（5 秒/条实时数据），按接入规模预估连接数与带宽 |

##### 方案 A：部署 EMQX 5.x（推荐，与 EasyDetek 云端同构）

EasyDetek 云端生产环境使用 EMQX 5.3.0，客户采用同款 Broker 兼容性最好。

**docker-compose.yml（精简版，仅需 EMQX）：**

```yaml
services:
  emqx:
    image: emqx/emqx:5.3.0
    container_name: customer-emqx
    restart: always
    ports:
      - "1883:1883"    # 设备 MQTT 端口
      - "18083:18083"  # 管理控制台（仅内网开放）
    volumes:
      - emqx_data:/opt/emqx/data
      - ./emqx.conf:/opt/emqx/etc/emqx.conf:ro

volumes:
  emqx_data:
```

**emqx.conf（精简配置，使用内置账号数据库鉴权）：**

```hocon
node {
  name = "emqx@127.0.0.1"
  cookie = "请修改为随机字符串"
  data_dir = "/opt/emqx/data"
}

dashboard {
  listeners.http { bind = 18083 }
  default_username = "admin"
  default_password = "请务必修改默认密码"
}

## 使用内置数据库做账号密码认证（替代 EasyDetek 云端的 HTTP 认证）
authentication = [
  {
    mechanism = password_based
    backend = built_in_database
    user_id_type = username
    password_hash_algorithm {
      name = sha256
      salt_position = suffix
    }
  }
]

## 认证通过的客户端允许所有主题收发（按需可细化为 ACL 白名单）
authorization {
  no_match = allow
  deny_action = ignore
}

mqtt {
  max_inflight = 200
  max_mqueue_len = 5000
  mqueue_store_qos0 = true
  session_expiry_interval = "3600s"
  keepalive_backoff = 2
}

listeners.tcp.default {
  bind = "0.0.0.0:1883"
  max_connections = 1024000
}
```

**创建设备接入账号**（容器启动后任选一种方式）：

```bash
# 方式一：REST API（Dashboard API，用户名密码默认 admin/public）
curl -s -X POST "http://localhost:18083/api/v5/authentication/password_based%3Abuilt_in_database/users" \
  -u "admin:public" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your_device_user", "password": "YourStrongPassword!"}'

# 方式二：登录 Dashboard（http://服务器IP:18083），
#   访问控制 -> 客户端认证 -> 内置数据库 -> 用户管理 -> 添加用户
```

> 说明：EasyDetek 云端使用的 `REDACTED / REDACTED` 是平台侧共享账号，自建环境**请创建自己的独立账号**，不要复用。

##### 方案 B：部署 Mosquitto（轻量方案）

适用于小规模接入、资源受限场景。

**mosquitto.conf：**

```conf
# 设备 MQTT 监听端口
listener 1883
protocol mqtt

# 关闭匿名访问，启用密码文件认证
allow_anonymous false
password_file /mosquitto/config/passwd

# 持久化会话与消息（QoS1 离线补投）
persistence true
persistence_location /mosquitto/data/
autosave_interval 30

# 建议限制单客户端飞行窗口，与设备行为匹配
max_inflight_messages 200
max_queued_messages 5000
```

**创建账号密码文件：**

```bash
docker run --rm -v $(pwd):/mosquitto/config eclipse-mosquitto:2 \
  mosquitto_passwd -c -b /mosquitto/config/passwd your_device_user YourStrongPassword!
```

> Windows 环境请将 `$(pwd)` 替换为 PowerShell 的 `${PWD}` 或实际目录路径。

#### 6.3 服务端应用必须实现的逻辑

Broker 只负责消息转发，**设备期望的"请求-响应"行为必须由客户的服务端应用实现**，否则设备功能会异常（例如：不响应 `getSetting`，设备将一直使用默认配置运行）。

##### 6.3.1 订阅列表（服务端应用启动后立即订阅）

| 订阅 Topic（通配符） | 用途 |
| :--- | :--- |
| `radar/edv28a/+/data` | 实时数据/告警 |
| `radar/edv28a/+/report` | 睡眠报告 |
| `radar/edv28a/+/status` | 上线状态/信号质量 |
| `radar/edv28a/+/getSetting` | 配置请求（**需响应**） |
| `radar/edv28a/+/getOta` | OTA 请求（**需响应**） |
| `radar/edv28a/+/otaProcess` | OTA 进度 |
| `radar/edv28a/+/resInfo` | 版本信息（**需响应**） |
| `radar/edv28a/+/config/ack` | 配置回执 |

> 注意：不要订阅 `#`（全匹配）通配符再叠加上述具体主题，同一消息会被重复投递导致业务重复处理。

##### 6.3.2 响应规则表（核心）

| 收到的消息（Topic 末段） | 是否需要回复 | 回复 Topic | 回复 Payload | 不回复的后果 |
| :--- | :--- | :--- | :--- | :--- |
| `status` | 否 | - | - | 无（仅记录状态） |
| `resInfo` | **是** | `radar/edv28a/{id}/resInfo/ack` | `{"msg":"ok","code":"1"}` | 设备可能重复上报版本信息 |
| `getSetting` | **是** | `radar/edv28a/{id}/config/set` | 4.1 节完整配置 JSON | 设备使用默认参数运行 |
| `config/ack` | 否 | - | - | 无（记录配置结果即可） |
| `data` | 否 | - | - | 数据丢失 |
| `report` | 否 | - | - | 报告丢失 |
| `getOta` | **是**（若有固件服务） | `radar/edv28a/{id}/otaRes` | 4.8 节格式 | 设备不升级（可接受可不响应） |
| `otaProcess` | 否 | - | - | 升级状态无记录 |

##### 6.3.3 最小实现参考（Python / paho-mqtt）

```python
import json
import paho.mqtt.client as mqtt

BROKER = "127.0.0.1"
PORT = 1883
USERNAME = "your_device_user"
PASSWORD = "YourStrongPassword!"

# 每台设备的配置（存数据库或配置文件均可，字段不可缺省）
DEVICE_SETTINGS = {
    "867920075014440": {
        "device_id": "867920075014440",
        "device_name": "bedroom-radar",
        "time_zone": 8,
        "interest_sleep_start_time": 0,
        "interest_sleep_end_time": 480,
        "report_interval": 5,
        "detect_range_min": 20,
        "detect_range_max": 80,
        "hr_high": 120, "hr_low": 50,
        "rr_high": 40, "rr_low": 10,
        "apnea_sec": 30, "no_vital_sec": 10,
    }
}

def on_connect(client, userdata, flags, rc):
    for t in ["radar/edv28a/+/data", "radar/edv28a/+/report",
              "radar/edv28a/+/status", "radar/edv28a/+/getSetting",
              "radar/edv28a/+/getOta", "radar/edv28a/+/otaProcess",
              "radar/edv28a/+/resInfo", "radar/edv28a/+/config/ack"]:
        client.subscribe(t, qos=1)

def on_message(client, userdata, msg):
    parts = msg.topic.split("/")          # radar / edv28a / {device_id} / 动作
    device_id, action = parts[2], parts[3]
    payload = msg.payload.decode("utf-8")

    if action == "data":
        data = json.loads(payload)
        # 含 type+value 字段即为告警事件，否则为实时数据（格式见 4.3/4.4 节）
        save_time_series(device_id, data)
    elif action == "report":
        save_sleep_report(device_id, json.loads(payload))   # 格式见 4.5 节
    elif action == "status":
        mark_online(device_id, json.loads(payload))         # 含 csq
    elif action == "resInfo":
        client.publish(f"radar/edv28a/{device_id}/resInfo/ack",
                      json.dumps({"msg": "ok", "code": "1"}), qos=1)
    elif action == "getSetting":
        cfg = DEVICE_SETTINGS.get(device_id)
        if cfg:
            client.publish(f"radar/edv28a/{device_id}/config/set",
                          json.dumps(cfg), qos=1)           # 格式见 4.1 节
    elif action == "config/ack":
        record_config_result(device_id, json.loads(payload))
    elif action == "getOta":
        client.publish(f"radar/edv28a/{device_id}/otaRes",
                      json.dumps({"status": "error", "error": "OTA not supported"}),
                      qos=1)                                # 无固件服务时告知设备
    elif action == "otaProcess":
        record_ota_progress(device_id, json.loads(payload))

client = mqtt.Client(client_id="customer-server", protocol=mqtt.MQTTv311)
client.username_pw_set(USERNAME, PASSWORD)
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, PORT, keepalive=60)
client.loop_forever()
```

> `save_time_series` / `save_sleep_report` / `mark_online` 等函数由客户按自身业务实现（时序数据建议存 InfluxDB/TimescaleDB，报告类可存 MySQL/PostgreSQL）。

#### 6.4 自建场景业务规则（务必实现）

1. **离线判定**：维护 `device_id -> 最后消息时间` 心跳表，后台任务每 60 秒扫描一次，**超过 90 秒**无任何消息的设备标记为离线。设备任何主题的消息都应刷新心跳。
2. **数据类型校验**：`data` 主题中数值字段若为非整数（浮点、非数字字符串），建议按无效处理丢弃整条消息（与 EasyDetek 云端行为一致，见 4.3 节）。
3. **配置下发时机**：除响应 `getSetting` 外，用户在业务系统修改配置后也应主动向 `config/set` 发布全量配置，并等待 `config/ack`（建议超时 30 秒判定失败）。
4. **告警识别**：`data` 主题消息中同时包含 `type`（字符串）与 `value`（数值）字段时，该条为告警事件而非实时数据。
5. **OTA 可裁剪**：若客户无固件升级服务，收到 `getOta` 可回复 `{"status":"error","error":"OTA not supported"}` 或不回复，不影响其他功能；但**设备端需同步关闭自动检查升级**（联系设备供应商），避免设备周期性发起无效请求。

#### 6.5 安全建议

1. **独立账号**：为设备接入创建专用 MQTT 账号，不与管理后台账号混用；不同客户/项目建议使用不同账号。
2. **ACL 收紧**：生产环境建议将 `authorization.no_match` 改为 `deny`，并配置 ACL 仅允许设备在其自身主题（`radar/edv28a/{device_id}/#`）收发，防止一台设备伪造其他设备身份。
3. **管理端口隔离**：EMQX Dashboard（18083）仅内网访问，并修改默认密码 `admin/public`。
4. **TLS 加密**：公网传输建议启用 8883 TLS 监听，设备侧同步配置证书。
5. **服务器地址变更**：设备内置的 Broker 地址、端口、账号变更后需重新烧录或通过配置指令下发（具体方式联系设备供应商）。

:::info 规格书
完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz)获取，或联系 support@easydetek.com。
:::
