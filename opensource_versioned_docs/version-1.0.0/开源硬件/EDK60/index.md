---
title: "EDK60 开发板"
sidebar_position: 1
---

# EDK60 开发板

> EDK60 是 EasyDetek 推出的开发板，用于雷达方案的快速评估与二次开发。

## 概述

EDK60 面向需要快速验证 EasyDetek 雷达方案的工程师与集成商：硬件参考设计完全开放，原理图等设计资料可直接从[附件与资料](./attachments)页获取，便于二次开发与产品化设计。

结合 [ed_radar 组件](/opensource/开源软件/ed-radar)，可在 ESP-IDF 中以统一 API 快速对接 EasyDetek 雷达模组，无需关注各型号的协议细节。

## 示例工程

- **[EDK60 多工程 Demo（ed_edk60_demos）](/opensource/开源软件/ed-edk60-demos)** —— 17 个 ESP-IDF demo
  （GPIO / UART / ADC / Wi-Fi / BLE / 低功耗 / 雷达透传），一套工程用 menuconfig 单选编译，
  含板级支持包、引脚表与避坑清单；源码仓库
  [easydetek/ed_edk60_demos](https://github.com/easydetek/ed_edk60_demos)

## 应用案例

- **[EDK60 + EDV151 呼吸心率监测方案](/blog/edk60-vital-signs-edv151)** —— 用 EDK60 搭载 EDV151 生命体征雷达，
  非接触测量呼吸与心率并实时上报 PC，含实测数据、串口协议与关键调参经验
- **[EDK60 + EDV11P 侧装人数统计与轨迹跟踪](/blog/edk60-edv11p-person-tracking)** —— 墙角侧装 60°，
  单模组覆盖一片区域，实时输出最多 6 个目标的坐标与人数，30 分钟实测帧完整率 100%

## 快速上手

- **[生命体征检测实施指南（EDK60 + EDV151）](./flash-guide)** —— 零基础、免安装软件，5 分钟把**生命体征固件**烧进 EDK60 开发板，
  插上 EDV151 雷达坐稳 20~40 秒就能看到心率 / 呼吸率
- **[人数统计雷达实施指南（EDV11P 侧装）](./track-guide)** —— 接线 → 烧录 → 看到轨迹的完整配方，
  含安装几何、参数表、验证清单与故障排查

## 在线工具

不用装任何软件，浏览器里直接用（需 Chrome / Edge）：

**生命体征固件（EDK60 + EDV151）**

- [**网页烧录 · 体征固件**](pathname:///edk60/flash.html) —— 插 USB 即可把 EDV151 生命体征固件烧进 EDK60，无需 ESP-IDF
- [**网页实时监测**](pathname:///edk60/monitor.html) —— 连上板子就能看到心率 / 呼吸率 / 体动 / 距离

**人数统计固件（EDK60 + EDV11P）**

- [**网页烧录 · 人数统计固件**](pathname:///edk60/edv11p/flash.html) —— 插 USB 即可烧录，无需 ESP-IDF
- [**网页实时轨迹演示**](pathname:///edk60/edv11p/track.html) —— 连上板子就能看到目标轨迹与人数；默认只读，需手动确认才会写入雷达配置

## 资料下载

- [原理图（SCH_EDK60_VA）](./attachments#原理图)：完整电路设计，PDF 格式

更多硬件资料（用户手册、引脚映射表、示例工程等）将陆续发布在[附件与资料](./attachments)页。

