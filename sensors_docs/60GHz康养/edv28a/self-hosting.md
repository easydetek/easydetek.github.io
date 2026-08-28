---
title: "EDV28A 自建 MQTT 服务器对接指南"
sidebar_position: 3
---


# EDV28A 自建 MQTT 服务器对接指南

> 客户不使用 EasyDetek 云端服务、自行搭建 MQTT 服务端时的完整对接指南。设备侧通信协议与云端接入一致（见 [MQTT 对接协议](./mqtt)），仅 Broker 地址、端口、账号不同。

如果客户不使用 EasyDetek 云端服务，而是自行搭建服务端，需要完成两部分工作：**① 部署一个 MQTT Broker；② 开发服务端应用程序**（替代 EasyDetek 服务端处理设备消息并作出响应）。设备端无需修改协议，只需将设备内置的 MQTT 服务器地址、端口、账号更新为客户自建服务的信息（配置方式请联系设备供应商）。

### 6.1 整体架构

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

### 6.2 MQTT Broker 部署要求

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

#### 方案 A：部署 EMQX 5.x（推荐，与 EasyDetek 云端同构）

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

#### 方案 B：部署 Mosquitto（轻量方案）

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

### 6.3 服务端应用必须实现的逻辑

Broker 只负责消息转发，**设备期望的"请求-响应"行为必须由客户的服务端应用实现**，否则设备功能会异常（例如：不响应 `getSetting`，设备将一直使用默认配置运行）。

#### 6.3.1 订阅列表（服务端应用启动后立即订阅）

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

#### 6.3.2 响应规则表（核心）

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

#### 6.3.3 最小实现参考（Python / paho-mqtt）

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

### 6.4 自建场景业务规则（务必实现）

1. **离线判定**：维护 `device_id -> 最后消息时间` 心跳表，后台任务每 60 秒扫描一次，**超过 90 秒**无任何消息的设备标记为离线。设备任何主题的消息都应刷新心跳。
2. **数据类型校验**：`data` 主题中数值字段若为非整数（浮点、非数字字符串），建议按无效处理丢弃整条消息（与 EasyDetek 云端行为一致，见 4.3 节）。
3. **配置下发时机**：除响应 `getSetting` 外，用户在业务系统修改配置后也应主动向 `config/set` 发布全量配置，并等待 `config/ack`（建议超时 30 秒判定失败）。
4. **告警识别**：`data` 主题消息中同时包含 `type`（字符串）与 `value`（数值）字段时，该条为告警事件而非实时数据。
5. **OTA 可裁剪**：若客户无固件升级服务，收到 `getOta` 可回复 `{"status":"error","error":"OTA not supported"}` 或不回复，不影响其他功能；但**设备端需同步关闭自动检查升级**（联系设备供应商），避免设备周期性发起无效请求。

### 6.5 安全建议

1. **独立账号**：为设备接入创建专用 MQTT 账号，不与管理后台账号混用；不同客户/项目建议使用不同账号。
2. **ACL 收紧**：生产环境建议将 `authorization.no_match` 改为 `deny`，并配置 ACL 仅允许设备在其自身主题（`radar/edv28a/{device_id}/#`）收发，防止一台设备伪造其他设备身份。
3. **管理端口隔离**：EMQX Dashboard（18083）仅内网访问，并修改默认密码 `admin/public`。
4. **TLS 加密**：公网传输建议启用 8883 TLS 监听，设备侧同步配置证书。
5. **服务器地址变更**：设备内置的 Broker 地址、端口、账号变更后需重新烧录或通过配置指令下发（具体方式联系设备供应商）。
