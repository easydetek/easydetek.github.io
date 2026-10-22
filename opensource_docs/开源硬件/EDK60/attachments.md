---
title: "附件与资料"
sidebar_position: 2
---

# EDK60 附件与资料

> 本页汇总 EDK60 开发板的软硬件资料，持续更新。

## 原理图

- **[SCH_EDK60_VA.pdf](./assets/SCH_EDK60_VA.pdf)** —— EDK60 原理图（VA 版本），PDF 格式

## 固件

- **[edk60_edv151_vital.bin](pathname:///edk60/edk60_edv151_vital.bin)** —— EDV151 体征雷达示例固件
  （**合并固件，烧录地址 `0x0`**；烧录方法见[生命体征检测实施指南（EDK60 + EDV151）](./flash-guide.md)）
- 网页一键烧录（EDV151 生命体征固件）：[⚡ 烧录页面](pathname:///edk60/flash.html)
- 网页实时显示（EDV151）：[📊 数据显示页面](pathname:///edk60/monitor.html)

## PC 侧工具

| 工具 | 用途 | 下载 |
|---|---|---|
| radar_watch.py | 体征验收：实时显示心率呼吸、达标判定、日志落盘 | [下载](pathname:///edk60/radar_watch.py) |
| radar_monitor.py | 通用监视：自动分离日志与雷达数据帧 | [下载](pathname:///edk60/radar_monitor.py) |
| radar_cmd.py | 直接给雷达模组下发命令（读参数、调增益、改上报周期） | [下载](pathname:///edk60/radar_cmd.py) |

:::tip 运行环境
三个脚本依赖 Python 3 与 `pyserial`，安装：`pip install pyserial`
:::

## 相关文档

- [EDK60 开发板概览](./index.md)
- [生命体征检测实施指南（EDK60 + EDV151）](./flash-guide.md)
- [应用案例：EDK60 + EDV151 呼吸心率监测方案](/blog/edk60-vital-signs-edv151)

## 其他资料

用户手册、引脚映射表等资料将持续补充到本页；如需获取未列出的资料，请联系
[support@easydetek.com](mailto:support@easydetek.com)。


