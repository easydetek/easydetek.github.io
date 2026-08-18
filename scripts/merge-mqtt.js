/**
 * 合并 EDV21C MQTT 协议文档到产品页
 * 用法：node scripts/merge-mqtt.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MQTT_FILE = path.join(ROOT, 'mqtt-temp.md');
const PROD_FILE = path.join(ROOT, 'sensors_docs', '60GHz康养', 'edv21c-w-01.md');

const raw = fs.readFileSync(MQTT_FILE, 'utf8');
const lines = raw.split('\n');

// 正文起点：最后一个一级标题「# EDV21C MQTT 协议说明」（跳过开头修订表，容忍 \r 和日期后缀）
let h1Idx = -1;
lines.forEach((l, i) => {
  if (/^#\s*EDV21C\s*MQTT\s*协议说明/.test(l.trim())) h1Idx = i;
});
if (h1Idx === -1) {
  console.error('❌ 未找到协议正文 H1');
  process.exit(1);
}

let body = lines.slice(h1Idx + 1).join('\n').trim();

// 标题降级：## N. → ### N.
body = body.replace(/^## /gm, '### ');

// MDX 转义：代码块外的 {xxx} 改为 \{xxx\}（否则被当 JSX 表达式）
// 先按 ``` 分段，只处理非代码段
const parts = body.split(/(```[\s\S]*?```)/g);
body = parts
  .map((seg) =>
    seg.startsWith('```')
      ? seg
      : seg.replace(/\{([^}\n]*)\}/g, '\\{$1\\}')
  )
  .join('');

const section = [
  '',
  '## MQTT 协议说明',
  '',
  '> 本协议定义 EDV21C 的 MQTT 通信：设备上行遥测（occupancy/status/targets/zones/info/fall）、服务器下行配置与控制（reboot/ota/factory_reset）。数据格式 JSON，topic 前缀 `edv21c/{device_id}/`。',
  '',
  body,
  '',
].join('\n');

let prod = fs.readFileSync(PROD_FILE, 'utf8');
const infoIdx = prod.indexOf(':::info 规格书');

if (infoIdx > -1) {
  prod = prod.slice(0, infoIdx).trimEnd() + '\n' + section + '\n' + prod.slice(infoIdx);
} else {
  prod = prod.trimEnd() + '\n' + section;
}

fs.writeFileSync(PROD_FILE, prod);
console.log('✅ 合并完成，产品文档行数:', prod.split('\n').length);
