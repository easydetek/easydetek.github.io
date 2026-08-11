/**
 * 独立传感器产品文档生成（数据源：钉钉产品知识库 > 独立传感器清单）
 */
const fs = require('fs');
const path = require('path');

const sensorData = [
  {model:'EDC286-Y-06',status:'正式量产',band:'5.8GHz',sense:'可见光+毫米波',vin:'DC 12V~24V',output:'干接点',tune:'红外遥控器',mount:'顶装嵌入式45mm开孔',feature:'穿透性强，支持环境光识别'},
  {model:'EDC287-Y-02',status:'正式量产',band:'5.8GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'AC火线out 1路',tune:'拨码开关',mount:'顶装嵌入式55mm开孔',feature:'拨码配置参数，支持环境光识别'},
  {model:'EDC211D',status:'正式量产',band:'5.8GHz',sense:'毫米波',vin:'AC 90V~260V',output:'AC火线out 1路',tune:'拨码开关',mount:'M20螺纹',feature:'可调系列照明部件'},
  {model:'EDQ286-Y-06',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'DC 12V~24V',output:'干接点',tune:'红外遥控器',mount:'顶装嵌入式45mm开孔',feature:'支持移动、存在探测，支持可见光识别'},
  {model:'EDQ252-Y-04',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'AC火线out 1路',tune:'红外遥控器',mount:'顶装嵌入式55mm开孔',feature:'支持移动、存在探测，继电器ON/OFF输出'},
  {model:'EDQ282-Y-03',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'AC火线out 2路',tune:'红外遥控器',mount:'顶装嵌入式65mm开孔',feature:'支持双路强电输出控制，支持环境光识别，拨码开关设计'},
  {model:'EDQ253-Y-03',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'Tuya Zigbee',tune:'红外遥控器、Tuya',mount:'顶装嵌入式55mm开孔',feature:'涂鸦Zigbee无线通讯协议，支持左右分区探测'},
  {model:'EDQ25M-Y-01',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'米家平台',tune:'米家APP',mount:'顶装嵌入式55mm开孔',feature:'已接入米家APP'},
  {model:'EDQ251-T-Z',status:'正式量产',alias:'EDQ251Z-Y-02',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'Tuya Zigbee',tune:'红外遥控器、Tuya',mount:'顶装明装款',feature:'涂鸦Zigbee协议，支持左右分区探测，支持移动和存在探测'},
  {model:'EDQ25L-Y-01',status:'正式量产',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'AC火线out 1路',tune:'红外遥控器',mount:'顶装明装款',feature:'多级智能调参，支持雷达阈值学习，支持蓝牙连接/微信小程序/APP控制'},
  {model:'EDQ286B',status:'正式量产',priority:'主推',alias:'EDQ254-G-01',band:'24GHz',sense:'可见光+毫米波',vin:'DC 12V~24V',output:'干接点、BLE',tune:'BLE',mount:'顶装嵌入式55mm开孔',feature:'支持屏蔽分区检测，支持微信小程序蓝牙配置'},
  {model:'EDQ253-S-01',status:'正式量产',priority:'主推',band:'24GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'AC火线out 1路、BLE',tune:'BLE',mount:'顶装嵌入式55mm开孔',feature:'高灵敏度设计，支持屏蔽分区检测，支持微信小程序蓝牙配置'},
  {model:'EDQ251-G-01',status:'研发测试',band:'24GHz',sense:'可见光+毫米波',vin:'DC 12V~24V',output:'干接点、BLE',tune:'BLE',mount:'顶装明装款',feature:'支持左右分区检测，支持屏蔽分区检测，小尺寸明装独立安装'},
  {model:'EDQ201-T-01',status:'正式量产',band:'24GHz',sense:'可见光+PIR+毫米波',vin:'CR2450 (3V)',output:'Tuya Zigbee',tune:'Tuya',mount:'3M胶贴、磁吸',feature:'双鉴协同感知，超低功耗设计'},
  {model:'EDQ201-M-01',status:'正式量产',band:'24GHz',sense:'可见光+PIR+毫米波',vin:'CR2450 (3V)',output:'米家平台',tune:'米家',mount:'3M胶贴、磁吸',feature:'双鉴协同感知，接入米家平台调节参数'},
  {model:'EDQ25S-G-01',status:'研发测试',priority:'优先',band:'24GHz',sense:'可见光+PIR+毫米波',vin:'DC 12V~24V',output:'干接点、BLE',tune:'BLE',mount:'顶装嵌入式55mm开孔',feature:'双鉴协同感知'},
  {model:'EDQ25S-M',status:'研发测试',band:'24GHz',sense:'可见光+PIR+毫米波',vin:'AC 90V~260V',output:'米家平台',tune:'BLE',mount:'顶装嵌入式55mm开孔',feature:'双鉴协同感知，接入米家平台调节参数'},
  {model:'EDV25P-T-02',status:'研发测试',band:'60GHz',sense:'可见光+毫米波',vin:'AC 90V~260V',output:'BLE、Tuya Zigbee',tune:'BLE、Tuya',mount:'顶装嵌入式55mm开孔',feature:'支持跌倒检测、人员存在判断，支持联动报警系统或护理平台'},
  {model:'EDV28A',status:'研发测试',band:'60GHz',sense:'毫米波',vin:'DC 5V',output:'Cat1',tune:'Cat1',mount:'卡扣',feature:'实时探测胸腔毫米级微动，智能监测睡眠阶段，智能识别异常呼吸或心率'},
  {model:'EDV21C-W-01',status:'研发测试',band:'60GHz',sense:'毫米波',vin:'AC 90V~260V',output:'MQTT、BLE',tune:'BLE',mount:'顶装嵌入式55mm开孔',feature:'支持人数统计，60GHz强抗干扰天线，蓝牙小程序调节'},
];

function genDoc(p) {
  const dir = path.resolve(__dirname, '..', 'sensors_docs');
  const filename = p.model.toLowerCase().replace(/[^a-z0-9]/g,'-') + '.md';
  const badge = p.priority ? `（${p.priority}）` : '';
  const statusBadge = p.status === '正式量产' ? '✅ 正式量产' : '🔧 研发测试';
  const md = `---
sidebar_position: 1
---

# ${p.model}${badge}

> ${p.feature}｜${p.band} 独立传感器｜${statusBadge}

## 核心特点

${p.feature}

${p.alias ? `**新命名：** ${p.alias}\n` : ''}## 规格参数

| 参数 | 规格 |
|------|------|
| 工作频段 | ${p.band} |
| 感应方式 | ${p.sense} |
| 输入电压 | ${p.vin} |
| 输出方式 | ${p.output} |
| 调参方式 | ${p.tune} |
| 安装方式 | ${p.mount} |
| 产品状态 | ${p.status} |

:::info 规格书
完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/14lgGw3P8vvQRw5dUg2exAlg85daZ90D)获取，或联系 support@easydetek.com。
:::
`;
  fs.writeFileSync(path.join(dir, filename), md);
  return filename;
}

sensorData.forEach(genDoc);
console.log('✅ 已生成 ' + sensorData.length + ' 个独立传感器文档 → sensors_docs/');
