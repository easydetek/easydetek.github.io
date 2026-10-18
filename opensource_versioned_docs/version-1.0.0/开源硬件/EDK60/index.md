---
title: "EDK60 开发板"
sidebar_position: 1
---

# EDK60 开发板

> EDK60 是 EasyDetek 推出的开发板，用于雷达方案的快速评估与二次开发。

## 概述

EDK60 面向需要快速验证 EasyDetek 雷达方案的工程师与集成商：硬件参考设计完全开放，原理图等设计资料可直接从[附件与资料](./attachments)页获取，便于二次开发与产品化设计。

结合 [ed_radar 组件](/opensource/开源软件/ed-radar)，可在 ESP-IDF 中以统一 API 快速对接 EasyDetek 雷达模组，无需关注各型号的协议细节。

## 应用案例

- **[EDK60 + EDV151 呼吸心率监测方案](/blog/edk60-vital-signs-edv151)** —— 用 EDK60 搭载 EDV151 生命体征雷达，
  非接触测量呼吸与心率并实时上报 PC，含实测数据、串口协议与关键调参经验

## 快速上手

- **[新手烧录指南](./flash-guide)** —— 零基础、免安装软件，5 分钟把固件烧进板子并看到心率数据

## 资料下载

- [原理图（SCH_EDK60_VA）](./attachments#原理图)：完整电路设计，PDF 格式

更多硬件资料（用户手册、引脚映射表、示例工程等）将陆续发布在[附件与资料](./attachments)页。

