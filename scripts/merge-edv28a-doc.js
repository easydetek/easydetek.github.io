/**
 * 同步 EDV28A MQTT 对接文档到产品子页面
 * 来源：钉钉文档《EDV28A 呼吸睡眠监测设备 MQTT 对接文档（云端接入 + 自建服务器指南）》（导出为 edv28a-temp.md）
 * 目标：sensors_docs/60GHz康养/edv28a/mqtt.md（第 1–5 章）
 *       第 6 章（自建服务器指南）归 self-hosting.md 管理，本脚本不覆盖
 * 用法：node scripts/merge-edv28a-doc.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOC_FILE = path.join(ROOT, 'edv28a-temp.md');
const MQTT_FILE = path.join(ROOT, 'sensors_docs', '60GHz康养', 'edv28a', 'mqtt.md');

const raw = fs.readFileSync(DOC_FILE, 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

// 正文起点：文档自带 H1 标题（跳过，标题信息进页面 H1/引言）
const h1Idx = lines.findIndex((l) => /^#\s+EDV28A/.test(l.trim()));
if (h1Idx === -1) {
  console.error('❌ 未找到文档 H1 标题');
  process.exit(1);
}
let body = lines.slice(h1Idx + 1).join('\n').trim();

// 第 6 章（自建服务器指南）单独归 self-hosting.md，本页只保留第 1–5 章
const ch6Idx = body.indexOf('## 6. 附录');
if (ch6Idx > -1) body = body.slice(0, ch6Idx).trim();

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

// 凭据脱敏：平台 MQTT 账号不对外公开（2026-08 起从文档站移除）
// 注意：正则用通用模式匹配，不在脚本里保留真实凭据字面量
const before = body;
body = body
  .replace(/\| Username \| `[^`\n]*` \|\n\| Password \| `[^`\n]*` \|/g, '| Username / Password | 以对接分配信息为准（不对外公开，请联系 EasyDetek 获取） |')
  .replace(/> [^\n>]*是平台侧共享账号[^\n]*/g, '> 说明：自建环境请创建**自己的独立设备接入账号**，不要与 EasyDetek 云端共享账号，也不要在多环境间复用同一账号。');
if (body !== before) console.log('🔒 已对凭据字段脱敏');

// 子页面为独立文档，章节保持原文档层级（## N.），无需标题降级
const page = [
  '---',
  'title: "EDV28A MQTT 对接协议"',
  'sidebar_position: 2',
  '---',
  '',
  '# EDV28A MQTT 对接协议',
  '',
  '> 定义 EDV28A 接入 EasyDetek 平台的完整 MQTT 通信协议，供第三方设备端对接使用。设备类型标识 `edv28a`，Topic 前缀 `radar/edv28a/{device_id}/`。',
  '',
  body,
  '',
].join('\n');

fs.writeFileSync(MQTT_FILE, page);
console.log('✅ 已更新子页面:', path.relative(ROOT, MQTT_FILE), '，行数:', page.split('\n').length);
console.log('ℹ️ 自建服务器指南（第 6 章）在 self-hosting.md，如需更新请单独处理');
