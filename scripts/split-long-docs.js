#!/usr/bin/env node
/**
 * 长文档拆分：EDV28A / EDV21C 的产品 index.md 中并入的 MQTT 文档 → 独立子页面
 *
 * EDV28A:  index.md → index + mqtt.md（第1–5章）+ self-hosting.md（第6章/6.x 小节保持原编号）
 * EDV21C:  index.md → index + mqtt.md
 * 子页面标题回升一级（### → ## …），围栏代码块（hocon 注释 ##）不动
 * 处理范围：current 与 version-1.0.0 两份镜像
 *
 * 用法：node scripts/split-long-docs.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

// 围栏代码块不做任何改写
function mapOutsideFences(text, fn) {
  return text
    .split(/(```[\s\S]*?```)/g)
    .map((seg) => (seg.startsWith('```') ? seg : fn(seg)))
    .join('');
}

// 标题回升一级：### → ##，#### → ###，##### → ####（单遍 replace 防级联）
const shiftUp = (t) => mapOutsideFences(t, (s) => s.replace(/^(#{3,6}) /gm, (m, h) => '#'.repeat(h.length - 1) + ' '));

const fm = (title, pos) => `---\ntitle: "${title}"\nsidebar_position: ${pos}\n---\n`;

function processEdv28a(file) {
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('## MQTT 对接文档');
  const end = text.indexOf(':::info 规格书');
  if (start === -1 || end === -1) return console.log(`⏭️ ${path.relative(ROOT, file)}: 未找到 MQTT 段，跳过`);
  const section = text.slice(start, end);
  const rest = text.slice(0, start) + text.slice(end);

  const lines = section.split('\n');
  const ch6 = lines.findIndex((l) => /^### 6\. 附录/.test(l.trim()));
  // 引言 = 段首 quote 之后的段落区（device_type 说明等），正文 = 第 1–5 章
  const quoteIdx = lines.findIndex((l) => l.startsWith('> 本节定义'));
  const ch1 = lines.findIndex((l) => /^### 1\. /.test(l.trim()));
  const intro = lines.slice(quoteIdx + 1, ch1).join('\n').trim();
  const mqttBody = lines.slice(ch1, ch6).join('\n').trim();
  const ch6Lines = lines.slice(ch6);
  // 第 6 章标题行本身去掉（页 H1 已表达），保留 6.x 小节编号以稳住交叉引用
  const ch6Body = ch6Lines.slice(1).join('\n').trim();

  const mqttPage = [
    fm('EDV28A MQTT 对接协议', 2),
    '',
    '# EDV28A MQTT 对接协议',
    '',
    '> 定义 EDV28A 接入 EasyDetek 平台的完整 MQTT 通信协议，供第三方设备端对接使用。设备类型标识 `edv28a`，Topic 前缀 `radar/edv28a/{device_id}/`。',
    '',
    intro.replace(
      /请参照 \*\*第 6 章《客户自建 MQTT 服务器对接指南》\*\* 完成/,
      '请参照 [《客户自建 MQTT 服务器对接指南》](./self-hosting) 完成'
    ),
    '',
    shiftUp(mqttBody),
    '',
  ].join('\n');

  const hostPage = [
    fm('EDV28A 自建 MQTT 服务器对接指南', 3),
    '',
    '# EDV28A 自建 MQTT 服务器对接指南',
    '',
    '> 客户不使用 EasyDetek 云端服务、自行搭建 MQTT 服务端时的完整对接指南。设备侧通信协议与云端接入一致（见 [MQTT 对接协议](./mqtt)），仅 Broker 地址、端口、账号不同。',
    '',
    shiftUp(ch6Body),
    '',
  ].join('\n');

  const nav = [
    '## 相关文档',
    '',
    '- [MQTT 对接协议](./mqtt)：设备接入 EasyDetek 云端/自建服务器的完整通信协议（主题、payload、时序、OTA）',
    '- [自建 MQTT 服务器对接指南](./self-hosting)：客户自建 Broker（EMQX/Mosquitto）与服务端应用开发指南',
    '',
    '',
  ].join('\n');

  const newIndex = rest.replace(':::info 规格书', nav + ':::info 规格书');

  return { newIndex, pages: { 'mqtt.md': mqttPage, 'self-hosting.md': hostPage } };
}

function processEdv21c(file) {
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('## MQTT 协议说明');
  const end = text.indexOf(':::info 规格书');
  if (start === -1 || end === -1) return console.log(`⏭️ ${path.relative(ROOT, file)}: 未找到 MQTT 段，跳过`);
  const section = text.slice(start, end);
  const rest = text.slice(0, start) + text.slice(end);

  // 段首 `## MQTT 协议说明` 行丢弃（页 H1 已表达），quote/修订表/正文全部保留
  const body = section.split('\n').slice(1).join('\n').trim();

  const mqttPage = [
    fm('EDV21C MQTT 协议说明', 2),
    '',
    '# EDV21C MQTT 协议说明',
    '',
    shiftUp(body),
    '',
  ].join('\n');

  const nav = [
    '## 相关文档',
    '',
    '- [MQTT 协议说明](./mqtt)：设备上行遥测（occupancy/status/targets/zones/info/fall）与服务器下行配置、控制的完整协议',
    '',
    '',
  ].join('\n');

  const newIndex = rest.replace(':::info 规格书', nav + ':::info 规格书');

  return { newIndex, pages: { 'mqtt.md': mqttPage } };
}

const TASKS = [
  { matcher: /60GHz康养[/\\]edv28a[/\\]index\.md$/, fn: processEdv28a },
  { matcher: /60GHz康养[/\\]edv21c[/\\]index\.md$/, fn: processEdv21c },
];

let done = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (TASKS.some((t) => t.matcher.test(p))) {
      const task = TASKS.find((t) => t.matcher.test(p));
      const result = task.fn(p);
      if (!result) continue;
      const dirOf = path.dirname(p);
      console.log(`\n📄 ${path.relative(ROOT, p)}`);
      if (dryRun) {
        console.log(`   [dry] 将拆出: ${Object.keys(result.pages).join(', ')}，index 加「相关文档」`);
        continue;
      }
      fs.writeFileSync(p, result.newIndex);
      for (const [name, content] of Object.entries(result.pages)) {
        fs.writeFileSync(path.join(dirOf, name), content);
        console.log(`   ➕ ${name}（${content.split('\n').length} 行）`);
      }
      done++;
    }
  }
}

walk(ROOT);
console.log(`\n${dryRun ? '[dry-run] ' : ''}完成：处理 ${done} 个产品目录`);
