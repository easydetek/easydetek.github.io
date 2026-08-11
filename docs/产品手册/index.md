---
# 产品手册落地页：按产品线分标签页展示，类似 ESP-IDF 按芯片分类
slug: /产品手册
pagination_prev: null
pagination_next: null
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 产品手册

EasyDetek 产品按应用形态分为三大产品线。点击下方标签选择产品线，再进入具体型号查看完整规格。

<Tabs>
  <TabItem value="edv" label="EDV · 微波存在传感器" default>

  高性能微波人体存在传感器，支持静止人体微动检测，适用于高端照明与智能家居。

  | 型号 | 定位 | 关键能力 |
  |------|------|---------|
  | [EDV531](/docs/产品手册/edv532) | 定制原型机 | 灵活可定制 |
  | [EDV532](/docs/产品手册/edv532) | 高性能存在传感器 | 微动检测、可调灵敏度 |

  </TabItem>

  <TabItem value="edq" label="EDQ · 成品传感器">

  即装即用的传感器成品，含外壳与认证，面向工程批量应用。

  | 型号 | 定位 | 关键能力 |
  |------|------|---------|
  | [EDQ55G / EDQ55H](/docs/产品手册/edq55g-edq55h) | 导轨集群 | 长距离、多机组网 |
  | [EDQ25S-K](/docs/产品手册/edq25s-k) | 双鉴 KNX | 雷达+红外双鉴、KNX 总线 |

  </TabItem>

  <TabItem value="edc" label="EDC · 嵌入式模组">

  超小体积嵌入式雷达模组，专为灯具内置集成设计。

  | 型号 | 定位 | 关键能力 |
  |------|------|---------|
  | [EDC116](/docs/产品手册/edc116-edc189c) | 吸顶灯感应 | 小体积、微动检测 |
  | [EDC189C](/docs/产品手册/edc116-edc189c) | 橱柜/小夜灯 | 极小体积、低功耗 |

  </TabItem>
</Tabs>

---

## 选型建议

不确定选哪款？参考下表按场景快速定位：

| 应用场景 | 推荐型号 | 理由 |
|---------|---------|------|
| 吸顶灯人体存在 | EDC116 / 5.8G 模组 | 小体积、微动检测、可嵌入灯具 |
| 橱柜 / 小夜灯 | EDC189C | 极小体积、低功耗 |
| 高端 KNX 智能家居 | EDQ25S-K | 双鉴防误报、KNX 总线 |
| 大空间安防 / 导轨集群 | EDQ55G / EDQ55H | 多机组网、长距离 |
| 定制原型验证 | EDV531 | 灵活可定制 |

更多细节请进入对应型号页面，或查看[开发对接](/docs/开发对接/communication-protocol)文档。
