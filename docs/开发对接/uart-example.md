---
sidebar_position: 2
---

# 串口（UART）对接示例

适用于带串口输出的雷达传感器（如 EDV 系列）。下面用 Python 演示读取检测数据。

## 串口参数

| 参数 | 值 |
|------|----|
| 波特率 | 115200（默认，可配） |
| 数据位 | 8 |
| 停止位 | 1 |
| 校验位 | 无 |

## Python 读取示例

```python
import serial

# 按实际端口修改：Windows 如 'COM3'，Linux 如 '/dev/ttyUSB0'
ser = serial.Serial('COM3', 115200, timeout=1)

try:
    while True:
        line = ser.readline().decode(errors='ignore').strip()
        if line:
            print(f'[雷达输出] {line}')
            # 在此解析具体字段，判断有人 / 无人 / 存在
finally:
    ser.close()
```

:::note 待补充
具体报文格式（帧头、字段、校验）需要您提供协议文档后，我再补充完整的解析代码。
:::

## 常见问题

- **收不到数据？** 检查 TX/RX 是否接反、波特率是否匹配。
- **数据乱码？** 多半是波特率或电压电平不匹配（确认是 TTL 电平，非 RS232）。
