/**
 * 从钉钉知识库获取的产品数据 → 批量生成 Docusaurus Markdown 文档
 * 数据源：产品知识库 > 产品清单（模组标准品清单）
 */
const fs = require('fs');
const path = require('path');

const moduleData = [
  {model:'EDC19A',band:'5.8GHz',feature:'超高灵敏度 15米max',func:'移动8-12m',output:'PWM',vin:'5-8V DC',vout:'0-3.3V DC可调',size:'35×34.5mm',market:'高空市场、传感器客户、智控及系统客户',mount:'挂高≤12m',scene:'仓库、厂房、体育馆、高空灯、高棚灯'},
  {model:'EDC19D',band:'5.8GHz',feature:'超高灵敏度',func:'>4m',output:'IO（兼容PWM）',vin:'5-8V',vout:'3.3±0.2V',size:'20×20mm',market:'光源和家居、高空市场、传感器客户',mount:'',scene:'仓库、厂房、体育馆'},
  {model:'EDC116',band:'5.8GHz',feature:'旗舰系列，挂高6米',func:'6-9m',output:'IO/UART/PWM',vin:'7-12V',vout:'5V',size:'20×22mm',market:'光源和家居、传感器客户、户外',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯'},
  {model:'EDC114B',band:'5.8GHz',feature:'带屏蔽壳，北美认证',func:'4-6m',output:'IO/PWM',vin:'7-12V',vout:'5±0.1V',size:'20×20mm',market:'光源和家居',mount:'常规3m',scene:'走廊、电梯口、楼梯间、吸顶灯、投光灯、shoplight'},
  {model:'EDC132',band:'5.8GHz',feature:'遥控可调',func:'2-6m',output:'IO/PWM',vin:'7-12V',vout:'5V',size:'22×20mm',market:'光源和家居、户外',mount:'常规3m',scene:'筒灯、宽板灯、投光灯、灯管、微波开关、天花灯、86感应开关、吸顶灯'},
  {model:'EDC15SA',band:'5.8GHz',feature:'自主品牌',func:'3-5m',output:'IO/PWM',vin:'5-12V',vout:'3.3±0.2V',size:'20×20mm',market:'光源和家居、消防应急市场',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯'},
  {model:'EDC188C',band:'5.8GHz',feature:'可拓展应用',func:'3-5m',output:'IO/PWM',vin:'5-12V',vout:'3.3V',size:'20×20mm',market:'光源和家居、镜子类市场',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯'},
  {model:'EDC189C',band:'5.8GHz',feature:'感应距离稳定',func:'0-2m',output:'IO',vin:'5-12V',vout:'3.3V',size:'20×20mm',market:'光源和家居、小夜灯、户外、宠物喂食/饮水机',mount:'常规挂壁1.2m',scene:'走廊、楼梯间、橱柜、庭院、筒灯、吸顶灯、太阳能灯、小夜灯、橱柜灯'},
  {model:'EDC18P',band:'5.8GHz',feature:'稳定性高',func:'3-5m',output:'高低电平',vin:'5-12V',vout:'3.3V',size:'直径18mm',market:'光源和家居、小夜灯',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯/组网灯管'},
  {model:'EDC18H',band:'5.8GHz',feature:'自主品牌',func:'3-5m',output:'IO/PWM',vin:'5-12V',vout:'3.3V',size:'18×18mm',market:'光源和家居',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯'},
  {model:'EDC18F',band:'5.8GHz',feature:'自主品牌',func:'3-5m',output:'IO/PWM',vin:'5-12V DC',vout:'3.3V',size:'20×20mm',market:'光源和家居、户外、消防应急市场',mount:'常规3m',scene:'走廊、电梯口、楼梯间、球泡灯、筒灯、吸顶灯、T管灯'},
  {model:'EDC18J',band:'5.8GHz',feature:'灯丝灯专用',func:'2-3m',output:'IO/PWM',vin:'5-12V',vout:'3.3±0.1V',size:'直径20mm',market:'光源和家居',mount:'常规3m',scene:'走廊、电梯口、楼梯间、灯丝灯、球泡灯、筒灯'},
  {model:'EDC139',band:'5.8GHz',feature:'高性能天线',func:'近档2-5m，远档4-8m',output:'PWM',vin:'7-12V',vout:'5/10±0.25V',size:'59.4×16×15.2mm',market:'灯具市场：三防灯、面板灯、吊线灯、导轨灯',mount:'',scene:''},
  {model:'EDC104C',band:'5.8GHz',feature:'自带逻辑算法',func:'0.3-2m',output:'IO',vin:'3.3±0.1V',vout:'3.3±0.1V',size:'35×13mm',market:'智能门锁和门铃',mount:'',scene:''},
  {model:'EDX106',band:'10.5GHz',feature:'低功耗',func:'0.3-2m可调',output:'IO',vin:'3.3V',vout:'3.3±0.1V',size:'12×7.5mm',market:'智能门锁和门铃',mount:'正对1.2m',scene:'走廊、玄关、智能门锁、猫眼'},
  {model:'EDQ114',band:'24GHz',feature:'挂高小尺寸模块',func:'移动/存在4-4.5m',output:'IO/UART',vin:'5-8V DC',vout:'3.3±0.3V',size:'14×14mm',market:'灯具市场',mount:'挂高3m',scene:'面板灯、吸顶灯、吊线灯、教育照明'},
  {model:'EDQ15K',band:'24GHz',feature:'高性能款',func:'移动/存在4-6m',output:'IO/UART',vin:'5-8V',vout:'3-3.6V',size:'15×18mm',market:'台灯及落地灯、传感器客户、空调/风扇/浴霸、宠物空气净化器',mount:'挂高',scene:'卫生间、厨房、书房、办公照明、面板灯、吸顶灯、T管灯、教育照明'},
  {model:'EDQ15L',band:'24GHz',feature:'雷达+蓝牙版本',func:'移动/存在3-5m',output:'PWM',vin:'5-8V',vout:'0-3.3V',size:'16×22mm',market:'光源和家居、灯具市场、镜子类市场、传感器客户',mount:'挂高',scene:'卫生间、厨房、书房、办公照明、面板灯、吸顶灯、T管灯、教育照明'},
  {model:'EDQ155',band:'24GHz',feature:'PIR+24G雷达双鉴',func:'6m（max）',output:'IO',vin:'3.3V',vout:'3.3V',size:'26×24mm',market:'小夜灯',mount:'',scene:'小夜灯、闹钟、PIR双鉴传感器'},
  {model:'EDQ15P',band:'24GHz',feature:'精准测距',func:'移动/存在3-5m',output:'IO（兼容UART）',vin:'5-8V',vout:'3-3.6V',size:'22×10mm',market:'生态品牌及企业',mount:'',scene:'面板灯、吸顶灯、吊线灯、教育照明'},
  {model:'EDQ18KA',band:'24GHz',feature:'窄角度，人体占位探测（含 EDQ18KC）',func:'4-6m',output:'IO/UART',vin:'5-8V',vout:'3.3V',size:'15×18mm',market:'台灯及落地灯、小夜灯、传感器客户、空调/风扇/浴霸',mount:'',scene:''},
  {model:'EDQ15LG',band:'24GHz',feature:'环境光检测',func:'5m（max）',output:'蓝牙',vin:'0-10V',vout:'0-10V',size:'40×12.5mm',market:'灯具市场',mount:'',scene:''},
  {model:'EDQ15LK',band:'24GHz',feature:'支持蓝牙连接',func:'3-5m',output:'PWM',vin:'5-8V',vout:'0-3.3V',size:'32×24×12mm',market:'灯具市场',mount:'',scene:''},
  {model:'EDQ10S',band:'24GHz',feature:'超小尺寸（小夜灯/门锁款）',func:'0.5-2.5m',output:'IO',vin:'3.3V',vout:'3.3V',size:'12×8mm',market:'小夜灯、智能门锁和门铃、IPC',mount:'',scene:'走廊、玄关、智能门锁、智能面板'},
  {model:'EDQ10A',band:'24GHz',feature:'超小尺寸',func:'1-5m',output:'IO',vin:'3.3V',vout:'3.3V',size:'8×12mm',market:'小夜灯、镜子类、智能门锁、开关面板、厨电、宠物喂食',mount:'侧装1.2m',scene:'面板灯、广告机、智能门锁、橱柜灯'},
  {model:'EDQ12J',band:'24GHz',feature:'镜子灯专用/收发一体天线',func:'移动/存在0.7-1.5m',output:'IO/UART',vin:'5-8V',vout:'3.3V',size:'15×18mm',market:'镜子类市场',mount:'侧装1.2m',scene:''},
  {model:'EDQ12KA',band:'24GHz',feature:'高灵敏度呼吸探测',func:'默认5m',output:'IO/UART',vin:'5-8V DC',vout:'3.3V',size:'7×38mm',market:'台灯及落地灯、镜子类、冰箱/饮水机/净化器、广告显示屏',mount:'侧装1.2m',scene:'镜前灯、橱柜灯、闸机、广告机'},
  {model:'EDQ12T',band:'24GHz',feature:'智能马桶专用',func:'移动20-200cm/存在45-100cm',output:'串口(IO-MCU)',vin:'5-12V DC',vout:'3.3V',size:'-',market:'陶瓷卫浴：马桶、小便斗、镜柜、浴霸',mount:'',scene:''},
  {model:'EDV151',band:'60GHz',feature:'体征监测',func:'1m（默认0.7m）',output:'UART',vin:'3.3V',vout:'平均功耗≤0.1W',size:'18×15mm',market:'传感器客户、智能床、人数统计和占位探测',mount:'床上',scene:'卧室、康养机构'},
  {model:'EDV163',band:'60GHz',feature:'可调人存雷达',func:'移动/存在0-8m',output:'IO/UART',vin:'3.3V DC',vout:'3.3V DC',size:'18×15mm',market:'传感器客户、户外',mount:'侧装0.5-1.8m',scene:'卫生间、停车场占位、电话亭、投光灯、智能面板'},
];

const accessoryData = [
  {model:'EDC59A',feature:'光控传感器自动开关控制',func:'移动感应半径7-10m',output:'IO/PWM',vin:'12±1V DC',vout:'3.3V PWM',size:'-',market:'灯具市场、高空市场',mount:'挂高10-15m',scene:'仓库、厂房、体育馆、高空灯、高棚灯'},
  {model:'EDC593',feature:'超高灵敏度设计',func:'移动感应半径4-8m',output:'IO(兼容PWM)',vin:'8-12V',vout:'8-12V',size:'-',market:'灯具市场、高空市场',mount:'挂高13m',scene:'仓库、厂房、体育馆、高空灯、高棚灯'},
  {model:'EDC59Z',feature:'超高灵敏度设计',func:'>4m',output:'IO/PWM',vin:'8-12V',vout:'0-12V PWM / 0-10V DC',size:'-',market:'灯具市场、高空市场',mount:'挂高12m',scene:'仓库、厂房、体育馆、高空灯、高棚灯'},
  {model:'EDC59I',feature:'超高灵敏度设计',func:'>4m',output:'IO/PWM',vin:'8-12V',vout:'调制方式：CW',size:'-',market:'高空市场',mount:'挂高12m',scene:'仓库、厂房、体育馆、高空灯、高棚灯'},
];

function genDoc(p, dir, typeLabel) {
  const filename = p.model.toLowerCase().replace(/[^a-z0-9]/g,'-') + '.md';
  const md = `---
sidebar_position: 1
---

# ${p.model}

> ${p.feature}｜${p.band ? p.band + ' ' : ''}${typeLabel}

## 核心特点

${p.feature}

## 规格参数

| 参数 | 规格 |
|------|------|
${p.band ? `| 工作频段 | ${p.band} |\n` : ''}| 感应距离 | ${p.func || '-'} |
| 输出方式 | ${p.output || '-'} |
| 输入电压 | ${p.vin || '-'} |
| 输出电压 | ${p.vout || '-'} |
| 外形尺寸 | ${p.size || '-'} |

## 应用信息

| 项目 | 说明 |
|------|------|
| 细分市场 | ${p.market || '-'} |
| 安装方式 | ${p.mount || '-'} |
| 应用场景 | ${p.scene || '-'} |

:::info 规格书
完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz)获取，或联系 support@easydetek.com。
:::
`;
  fs.writeFileSync(path.join(dir, filename), md);
  return filename;
}

let count = 0;
const root = path.resolve(__dirname, '..');
moduleData.forEach(p => { genDoc(p, path.join(root,'modules_docs'), '模组'); count++; });
accessoryData.forEach(p => { genDoc(p, path.join(root,'accessories_docs'), '配件'); count++; });

console.log('✅ 已生成 ' + count + ' 个产品文档');
console.log('  模组: ' + moduleData.length + ' 款 → modules_docs/');
console.log('  配件: ' + accessoryData.length + ' 款 → accessories_docs/');
