---
title: "ed_radar – ESP-IDF 雷达组件库"
sidebar_position: 1
---

# ed_radar ESP-IDF 雷达组件库

> 面向多款易探雷达的**面向对象抽象接口层**：用统一的结构与 API 控制不同型号，屏蔽各型号数据组包、解包细节及结构体差异，并内置型号能力不兼容拦截｜标准 ESP-IDF 组件（IDF v5.0+）｜当前版本 **1.0.1**

- GitHub 仓库：[github.com/fuhua817/ed_radar](https://github.com/fuhua817/ed_radar)
- ESP Component Registry：[components.espressif.com/components/fuhua817/ed_radar](https://components.espressif.com/components/fuhua817/ed_radar)

## 支持型号

| 型号枚举 | 雷达 | 说明 |
|---|---|---|
| `ED_RADAR_DEVICE_EDQ152` | EDQ152 | 多扇区雷达，支持环境自学习、单通道独立配置 |
| `ED_RADAR_DEVICE_EDV163` / `EDV163_ASCII` | EDV163 | 3D 空间雷达（XYZ 边界、安装高度、屏蔽/感应区） |
| `ED_RADAR_DEVICE_EDV11P` | EDV11P | 支持存在检测独立开关 |

## 快速开始

### 1. 工程中引入组件

在工程根目录执行：

```bash
idf.py add-dependency "fuhua817/ed_radar^1.0.1"
```

或者在 `main/idf_component.yml` 中手动添加（也支持直接从 Git 拉取）：

```yaml
dependencies:
  ed_radar:
    git: https://github.com/fuhua817/ed_radar.git
    version: "*"
```

### 2. 配置组件

```bash
idf.py menuconfig
# -> Component config -> ED Radar Configuration
```

在此选择雷达型号（EDQ152 / EDV163 / EDV163_ASCII / EDV11P）、UART 端口号、TX/RX/EN 引脚、波特率及协议距离单位。

### 3. 创建雷达实例

```c
#include "ed_radar.h"

// 示例 1：使用 Kconfig 默认配置（型号在 menuconfig 中选择）
ed_radar_obj_t *my_radar = ed_radar_creat(&ED_RADAR_CONFIG_DEFAULT);

// 示例 2：自定义配置，创建一个 EDV11P 实例
ed_radar_config_t cfg = {
    .type        = ED_RADAR_DEVICE_EDV11P,
    .uart_num    = 1,
    .pin_tx      = 5,
    .pin_rx      = 4,
    .pin_en      = 7,
    .baudrate    = 921600,
    .buffer_size = 1024,
};
ed_radar_obj_t *my_radar = ed_radar_creat(&cfg);

if (my_radar == NULL) {
    // 实例化失败处理
}
```

### 4. 数据泵接管（数据收发任务）

在独立的数据接收 Task 中循环调用解析核心即可。底层驱动内部会自动从 UART 取数、组帧并分发给具体型号的解析器，**应用层不要自己先读串口数据**（否则会把数据抢走，导致解析器收不到完整帧）：

```c
while (1) {
    // 内部自动取数并分发给具体型号的解析器
    ed_radar_data_handle(my_radar);
    vTaskDelay(pdMS_TO_TICKS(10));
}
```

## 通用 API 概览

所有雷达尽量统一对齐这些方法，传入统一的基于空间（毫米 mm）的物理参数即可。

### 设备信息与系统控制

```c
ed_err_t ed_radar_get_module_info(ed_radar_obj_t *obj);

ed_err_t ed_radar_factory_reset(ed_radar_obj_t *obj);
ed_err_t ed_radar_set_work_mode(ed_radar_obj_t *obj, uint8_t mode);
ed_err_t ed_radar_set_radar_onoff(ed_radar_obj_t *obj, uint8_t onoff);
```

### 核心空间与边界控制（2D/3D 空间雷达，如 EDV163 / EDV11P）

```c
// 设置雷达实际安装高度
ed_err_t ed_radar_set_install_height(ed_radar_obj_t *obj, uint16_t mm);

// 限制雷达检测高度范围
ed_err_t ed_radar_set_detect_height(ed_radar_obj_t *obj, uint16_t min_mm, uint16_t max_mm);

// 设置空间 XYZ 轴探测边界（统一采用 ed_radar_detect_range_t）
ed_err_t ed_radar_set_detect_range(ed_radar_obj_t *obj, ed_radar_detect_range_t *range);

// 设置屏蔽区 / 感应区
ed_err_t ed_radar_set_shield_areas(ed_radar_obj_t *obj, uint8_t count, ed_radar_area_t *areas);
ed_err_t ed_radar_set_induct_areas(ed_radar_obj_t *obj, uint8_t count, ed_radar_area_t *areas);
```

### 延迟与灵敏度

```c
// 设置无人目标丢失的判定延迟时间
ed_err_t ed_radar_set_detect_delay_time(ed_radar_obj_t *obj, uint16_t delay_seconds);

// 设置动作与存在的整体探测灵敏度（自动展开给多通道雷达的全通道）
ed_err_t ed_radar_set_sensitivity(ed_radar_obj_t *obj, uint8_t motion, uint8_t presence);
```

## 型号专属能力（静默拦截过滤）

部分雷达拥有独特功能（如 EDQ152 的环境学习模式），可随时调用；若当前实例不支持，日志打印 `not supported` 警告并返回 `ED_FAIL`，不会引发内存或逻辑错误。

```c
// EDQ152 环境自学习系列
ed_err_t ed_radar_enter_self_learning(ed_radar_obj_t *obj, uint16_t duration_seconds);
ed_err_t ed_radar_exit_self_learning(ed_radar_obj_t *obj, uint8_t save);
ed_err_t ed_radar_restore_self_learning(ed_radar_obj_t *obj);
ed_err_t ed_radar_get_self_learning_status(ed_radar_obj_t *obj, uint16_t *remaining_seconds);

// EDQ152 等强制定帧输出无人
ed_err_t ed_radar_force_no_person(ed_radar_obj_t *obj);

// EDV11P 的存在检测单独开关
ed_err_t ed_radar_set_presence_switch(ed_radar_obj_t *obj, uint8_t enable);
```

## 进阶：专属向下穿透（Down-casting）

抽象必须妥协：例如 `ed_radar_set_detect_range` 要求通用 XYZ 参数，但若要对**多扇区雷达 EDQ152 做单通道独立细粒度配置**，抽象层无法同时覆盖。

`ed_radar_obj_t` 对应用层是**不透明句柄**（内部成员不可直接访问），此时可通过 `ed_radar_get_ctx()` 安全取出 `ctx` 指针并调用驱动专属头文件：

```c
#include "ed_radar.h"
#include "radar/edq152.h" // 引用专属驱动头

// type 为创建实例时使用的设备型号（即 ed_radar_config_t.type）
void custom_edq152_setup(ed_radar_obj_t *obj, uint32_t type)
{
    // 判断实体是否为 EDQ152
    if (type == ED_RADAR_DEVICE_EDQ152) {

        edq152_channel_range_t ch_range = {0};

        // 独家定制：针对通道 1 进行 0m 到 3m 的设置
        ch_range.channel = 1;
        ch_range.min_motion_dist = 0;
        ch_range.max_motion_dist = 3000;

        // 通过 ed_radar_get_ctx() 取出真实句柄并安全强转为 edq152_t
        edq152_set_detect_distance((edq152_t *)ed_radar_get_ctx(obj), ch_range);
    }
}
```

## 设计思想

组件采用**多态（Polymorphism）**与**外观模式（Facade）**：

- **`ed_radar_obj_t`（基类句柄）**：暴露给应用层的抽象句柄，对内通过 `void *ctx` 挂载各型号真实的设备上下文
- **向下强转拦截**：每个通用接口按创建实例时指定的型号（`obj->config.type`）进行 `switch` 分发——型号支持该功能则转化为底层结构下发；不兼容（如让 EDQ152 设置安装高度）则抛出预警并拦截（返回 `ED_FAIL`）

由此兼顾：**核心层 95% 代码的高度复用统一** + **应用层 5% 对实体特殊性能的安全穿透性**。

## 相关链接

- [GitHub 仓库](https://github.com/fuhua817/ed_radar)（Issue / PR / 源码）
- [ESP Component Registry 页面](https://components.espressif.com/components/fuhua817/ed_radar)（版本发布记录）
- 需要适配新型号或对接支持：support@easydetek.com
