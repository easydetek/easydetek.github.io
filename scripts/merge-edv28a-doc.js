/**
 * 合并 EDV28A MQTT 对接文档到产品页
 * 来源：钉钉文档《EDV28A 呼吸睡眠监测设备 MQTT 对接文档（云端接入 + 自建服务器指南）》
 * 用法：node scripts/merge-edv28a-doc.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOC_FILE = path.join(ROOT, 'edv28a-temp.md');
const PROD_FILE = path.join(ROOT, 'sensors_docs', '60GHz康养', 'edv28a.md');

const raw = fs.readFileSync(DOC_FILE, 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

// 正文起点：文档自带 H1 标题（跳过，标题信息进 section 引言）
let h1Idx = lines.findIndex((l) => /^#\s+EDV28A/.test(l.trim()));
if (h1Idx === -1) {
  console.error('❌ 未找到文档 H1 标题');
  process.exit(1);
}

let body = lines.slice(h1Idx + 1).join('\n').trim();

// 围栏代码块不做任何改写（hocon/bash/python 注释里的 # 不是 Markdown 标题）
function mapOutsideFences(text, fn) {
  return text
    .split(/(```[\s\S]*?```)/g)
    .map((seg) => (seg.startsWith('```') ? seg : fn(seg)))
    .join('');
}

// 标题降级一级，给产品页的「## MQTT 对接文档」让位：
// #### → #####，### → ####，## → ###（^ 前缀 + 空格锚定，不会二次命中）
body = mapOutsideFences(
  body,
  (seg) =>
    seg
      .replace(/^#### /gm, '##### ')
      .replace(/^### /gm, '#### ')
      .replace(/^## /gm, '### ')
);

// MDX 转义：围栏代码块外、行内代码 span 外的 {xxx} 改为 \{xxx\}
// （MDX 会把裸花括号当 JSX 表达式；代码块与行内代码不需要转义）
const parts = body.split(/(```[\s\S]*?```)/g);
body = parts
  .map((seg) => {
    if (seg.startsWith('```')) return seg;
    return seg
      .split(/(`[^`\n]+`)/g)
      .map((s) => (s.startsWith('`') ? s : s.replace(/\{([^}\n]*)\}/g, '\\{$1\\}')))
      .join('');
  })
  .join('');

const section = [
  '',
  '## MQTT 对接文档',
  '',
  '> 本节定义 EDV28A 呼吸睡眠监测设备接入 EasyDetek 平台的完整 MQTT 通信协议，供第三方设备端对接使用。设备类型标识 `edv28a`，Topic 前缀 `radar/edv28a/{device_id}/`。客户自建服务器对接指南见第 6 章。',
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
