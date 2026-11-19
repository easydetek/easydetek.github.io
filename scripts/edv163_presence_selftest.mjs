#!/usr/bin/env node
/**
 * scripts/edv163_presence_selftest.mjs
 * ---------------------------------------------------------------------------
 * 「EDK60 + EDV163-N-03 人体存在检测」网页演示页的无浏览器自测。
 *
 * 做法（关键）：不在本文件里重写一份解析器，而是从
 *   static/edk60/edv163-presence/presence.html
 * 里用正则抽出两段标记区间：
 *   // ==== CORE-BEGIN ==== … // ==== CORE-END ====    帧解析 / 组帧 / 0x81·0x80 解析 / 静默口径
 *   // ==== CASES-BEGIN ==== … // ==== CASES-END ====   16 条自测用例与用例运行器
 * 然后把它们拼进 new Function 里求值 —— 断言的就是页面「运行页内自测」跑的同一份实现
 * 与同一张用例表。页面里的解析器若被改坏，这里必然一起红。
 *
 * 额外回归（页面用例外）：
 *   E1 0x81 每通道 9 B 的字段顺序（逐字节偏移）
 *   E2 int16 大端负数的边界（-1 / -250 / -3000 / -32768 / 32767）
 *   E3 校验和函数对 4 条文档示例帧 + 4 条任务书指定帧的回归
 *      （文档《EDV163 替换 EDQ152 成品通用协议 V1.1》§4 命令举例给了 4 条真帧的校验和：
 *        GET 0x04 → 0x3A、SET 0x04=0 → 0x3D、SET 0x1F → 0x56、SET 0x17=10 → 0x5A）
 *      注：文档示例里 0x17 用的是 **1 B value** 口径（声明 13 / 线上 14 / 校验和 0x5A），
 *          演示页的「状态上报频率」按 **2 B value** 口径下发（00 0A：声明 14 / 线上 15 /
 *          校验和 0x5C）—— 两者口径不同、各自都自洽，相关断言名已标注口径，不是矛盾。
 *
 * 运行：node scripts/edv163_presence_selftest.mjs
 * 失败时 process.exitCode = 1（便于 CI / 本地一眼判定）。
 * 纯 Node 原生 ESM，零第三方依赖。
 * ---------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = join(HERE, '..', 'static', 'edk60', 'edv163-presence', 'presence.html');

let failures = 0;
let checks = 0;

function line(s = '') { process.stdout.write(s + '\n'); }
function ok(name, detail) {
  checks++;
  line('  [通过] ' + name + (detail ? '  — ' + detail : ''));
}
function bad(name, expected, actual) {
  checks++;
  failures++;
  line('  [失败] ' + name);
  if (expected !== undefined) line('         期望：' + expected);
  if (actual !== undefined) line('         实际：' + actual);
}
function eq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) ok(name, a);
  else bad(name, e, a);
}
function isTrue(name, cond, detail) {
  if (cond) ok(name, detail);
  else bad(name, '条件成立', detail || '条件不成立');
}

/* ==========================================================================
 * 一、抽取页面里的真实实现
 * ========================================================================== */
line('='.repeat(78));
line('EDV163-N-03 人体存在检测演示页 · 无浏览器自测');
line('源文件：' + HTML_PATH);
line('='.repeat(78));

let html;
try {
  html = readFileSync(HTML_PATH, 'utf8');
} catch (err) {
  bad('读取 presence.html', '文件存在且可读', String(err && err.message ? err.message : err));
  line('\n结论：无法读取源文件，自测中止。');
  process.exitCode = 1;
  process.exit();
}

function extract(src, begin, end, label) {
  const i = src.indexOf(begin);
  const j = src.indexOf(end);
  if (i < 0 || j < 0 || j <= i) {
    bad('抽取 ' + label + ' 标记区间', '存在 ' + begin + ' … ' + end,
        'i=' + i + ' j=' + j);
    return null;
  }
  return src.slice(i + begin.length, j);
}

const cfgSrc = extract(html, '// ==== CFG-BEGIN ====', '// ==== CFG-END ====', 'CFG');
const coreSrc = extract(html, '// ==== CORE-BEGIN ====', '// ==== CORE-END ====', 'CORE');
const casesSrc = extract(html, '// ==== CASES-BEGIN ====', '// ==== CASES-END ====', 'CASES');

if (!cfgSrc || !coreSrc || !casesSrc) {
  line('\n结论：页面里的标记区间缺失，无法验证「同一份实现」，自测失败。');
  process.exitCode = 1;
  process.exit();
}

line('');
line('一、抽取结果');
line('  CFG 段：' + cfgSrc.split('\n').length + ' 行 / ' + cfgSrc.length + ' 字符');
line('  CORE 段：' + coreSrc.split('\n').length + ' 行 / ' + coreSrc.length + ' 字符');
line('  CASES 段：' + casesSrc.split('\n').length + ' 行 / ' + casesSrc.length + ' 字符');
isTrue('CORE 段含 class EdvParser（确认抽到真解析器）', /class\s+EdvParser/.test(coreSrc));
isTrue('CORE 段含 createFrame（组帧器）', /function\s+createFrame/.test(coreSrc));
isTrue('CORE 段含 parseReport81（0x81 解析）', /function\s+parseReport81/.test(coreSrc));
isTrue('CORE 段含 evaluatePresence（静默口径）', /function\s+evaluatePresence/.test(coreSrc));
isTrue('CASES 段含 SELFTEST_CASES', /const\s+SELFTEST_CASES/.test(casesSrc));

const factoryBody = [
  cfgSrc,
  coreSrc,
  casesSrc,
  `return { CFG, P, checksum, escapeBytes, unescapeBytes, createFrame, createDeviceFrame,`,
  `  packFrame, maxHostPayloadLen,`,
  `  nextMsgId, EdvParser, parseReport81, parseReport80, buildReport81Payload,`,
  `  buildReport80Payload, buildUnescapedFrame, readInt16BE, readUint16BE, hexToBytes,`,
  `  bytesToHex, concatBytes, hex2, silenceWindowMs, evaluatePresence, evaluateLink,`,
  `  buildReadPlan, buildPresetPlan, buildFactoryResetPlan, decodeParam, SELFTEST_CASES,`,
  `  runSelftestCases };`
].join('\n');

let A;
try {
  A = new Function(factoryBody)();
  ok('new Function 求值页面真实代码', 'CORE + CASES 共 ' + (coreSrc.length + casesSrc.length) + ' 字符');
} catch (err) {
  bad('new Function 求值页面真实代码', '无异常', String(err && err.stack ? err.stack : err));
  line('\n结论：页面里的 CORE 段无法求值，自测失败。');
  process.exitCode = 1;
  process.exit();
}

/* ==========================================================================
 * 二、跑页面同一张用例表（16 条）
 * ========================================================================== */
line('');
line('二、用例表（与页面「运行页内自测」同一份 SELFTEST_CASES）');
const res = A.runSelftestCases();
for (const l of res.lines) line(l);
if (res.pass === res.total) {
  checks++;
  ok(res.head, `${res.pass}/${res.total}`);
} else {
  checks++;
  failures += (res.total - res.pass);
  bad(res.head, res.total + ' 条全部通过', res.pass + ' 条通过');
}

/* ==========================================================================
 * 三、额外回归
 * ========================================================================== */
line('');
line('三、额外回归（页面用例之外）');

/* --- E1：0x81 每通道 9 B 的字段顺序，逐字节偏移 --- */
{
  const data = A.hexToBytes('01 02 01 0A 09 FF 9C 01 F4');
  const rep = A.parseReport81(data);
  const c = (rep.channels && rep.channels[0]) || {};
  const by = (at) => ((data[at] << 8) | data[at + 1]);
  const i16 = (at) => (by(at) > 32767 ? by(at) - 65536 : by(at));
  eq('E1a 0x81 stride = 9 B', rep.stride, 9);
  eq('E1b 0x81 通道数 = tlv_len / 9 = 1', rep.count, 1);
  eq('E1c offset0 presence', c.presence, data[0]);
  eq('E1d offset1 state', c.state, data[1]);
  eq('E1e offset2 direction', c.direction, data[2]);
  eq('E1f offset3-4 x (int16 BE)', c.x, i16(3));
  eq('E1g offset5-6 y (int16 BE)', c.y, i16(5));
  eq('E1h offset7-8 z (int16 BE)', c.z, i16(7));
  eq('E1i 具体取值', [c.presence, c.state, c.direction, c.x, c.y, c.z],
     [1, 2, 1, 2569, -100, 500]);
  /* 多通道时第二通道从第 9 字节起 */
  const two = A.buildReport81Payload([
    { presence: 1, state: 1, direction: 0, x: 1, y: 2, z: 3 },
    { presence: 0, state: 0, direction: 0, x: -4, y: -5, z: -6 }
  ]);
  const rep2 = A.parseReport81(two);
  eq('E1j 第 2 通道起点 offset9', [rep2.channels[1].x, rep2.channels[1].y, rep2.channels[1].z],
     [-4, -5, -6]);
}

/* --- E2：int16 负数边界 --- */
{
  const cases = [
    ['-1', 'FF FF', -1], ['-250', 'FF 06', -250], ['-3000', 'F4 48', -3000],
    ['-32768', '80 00', -32768], ['32767', '7F FF', 32767], ['0', '00 00', 0]
  ];
  let allOk = true, detail = [];
  for (const [label, hex, want] of cases) {
    const got = A.readInt16BE(A.hexToBytes(hex), 0);
    detail.push(label + '→' + got);
    if (got !== want) allOk = false;
  }
  isTrue('E2a readInt16BE 负数/边界', allOk, detail.join(' '));
  const payload = A.buildReport81Payload([{ presence: 1, state: 1, direction: 0,
                                            x: -3000, y: -1, z: -250 }]);
  eq('E2b 载荷负数字节', A.bytesToHex(payload), '01 01 00 F4 48 FF FF FF 06');
  const back = A.parseReport81(payload).channels[0];
  eq('E2c 负坐标往返一致', [back.x, back.y, back.z], [-3000, -1, -250]);
}

/* --- E3a：文档 §4「命令举例」4 条真帧的整帧回归（校验和由代码生成，与文档原文逐字节一致） --- */
{
  const docs = [
    ['E3a-1 读取波特率 GET 0x04', 0xA0, 0x04, null, '45 44 00 0C 00 01 A0 04 00 00 3A 0A'],
    ['E3a-2 设置波特率 9600 SET 0x04=0', 0xA1, 0x04, [0x00],
      '45 44 00 0D 00 01 A1 04 00 01 00 3D 0A'],
    ['E3a-3 参数初始化 SET 0x1F', 0xA1, 0x1F, null, '45 44 00 0C 00 01 A1 1F 00 00 56 0A'],
    ['E3a-4 上报频率 1s SET 0x17=10（转义帧）（1 B value，协议示例口径）', 0xA1, 0x17, [0x0A],
      '45 44 00 0D 00 01 A1 17 00 01 09 01 5A 0A']
  ];
  for (const [name, op, type, data, want] of docs) {
    const got = A.bytesToHex(A.createFrame(op, type, data ? Uint8Array.from(data) : null, 0x0001));
    eq(name, got, want);
  }
}

/* --- E3b：任务书指定的 4 条帧（校验和必须与协议文档口径一致） --- */
{
  const spec = [
    ['E3b-1 GET 0x02 设备信息', 0xA0, 0x02, null, 0x38],
    ['E3b-2 SET 0x17=10（正文 0x0A 转义成 09 01）（1 B value，协议示例口径）', 0xA1, 0x17, [0x0A], 0x5A],
    ['E3b-3 SET 0x25=2500（0x09C4，正文 0x09 转义成 09 00）', 0xA1, 0x25, [0x09, 0xC4], 0x2D],
    ['E3b-4 GET 0x17 上报频率', 0xA0, 0x17, null, 0x4D]
  ];
  for (const [name, op, type, data, wantCs] of spec) {
    const wire = A.createFrame(op, type, data ? Uint8Array.from(data) : null, 0x0001);
    /* 用同一套解析器把刚组出来的帧还原回去，再对还原体独立复算一次校验和 */
    const p = new A.EdvParser();
    const frames = p.feed(wire);
    if (frames.length !== 1) {
      bad(name + ' 校验和', '帧可被解析器还原为 1 帧', '帧数 ' + frames.length);
      continue;
    }
    const f = frames[0];
    const unescaped = A.unescapeBytes(wire.subarray(0, wire.length - 1));
    eq(name + ' 帧内校验和', f.checksum, wantCs);
    eq(name + ' 校验和函数复算', A.checksum(unescaped.bytes, 0, unescaped.bytes.length - 1),
       wantCs);
    eq(name + ' 线上字节数 = 声明长度 + 转义处数', wire.length, f.lenField + f.escaped);
  }
  /* 转义帧必须比声明长度长：SET 0x17=10 正文 0x0A → 09 01 */
  const escWire = A.createFrame(0xA1, 0x17, Uint8Array.from([0x0A]), 0x0001);
  eq('E3b-5 SET 0x17=10：声明 13B / 线上 14B（多 1 B 转义）（1 B value，协议示例口径）', escWire.length, 14);
  eq('E3b-5 线上帧', A.bytesToHex(escWire), '45 44 00 0D 00 01 A1 17 00 01 09 01 5A 0A');
  /* 正文 0x09 → 09 00，同样只膨胀 1 字节 */
  const escWire9 = A.createFrame(0xA1, 0x17, Uint8Array.from([0x09]), 0x0001);
  eq('E3b-6 SET 0x17=9：声明 13B / 线上 14B（多 1 B 转义）（1 B value 口径，协议示例同口径）', escWire9.length, 14);
  eq('E3b-6 线上帧', A.bytesToHex(escWire9), '45 44 00 0D 00 01 A1 17 00 01 09 00 59 0A');
}

/* --- E4：只读计划与演示推荐 SET 计划的不变量 --- */
{
  const plan = A.buildReadPlan();
  eq('E4a 只读计划条数 = 14', plan.length, 14);
  eq('E4b 只读计划全部 op=0xA0（零 SET）', plan.every(p => p.op === 0xA0), true);
  eq('E4c 只读计划 type 顺序', plan.map(p => '0x' + A.hex2(p.type)),
     ['0x02', '0x11', '0x12', '0x17', '0x18', '0x1B', '0x1C', '0x1D', '0x1E',
      '0x24', '0x25', '0x13', '0x14', '0x27']);
  const preset = A.buildPresetPlan();
  eq('E4d 演示推荐 SET 条数 = 5', preset.length, 5);
  eq('E4e 演示推荐 type 顺序', preset.map(i => '0x' + A.hex2(i.type)),
     ['0x17', '0x11', '0x24', '0x25', '0x1E']);
  eq('E4f 0x17=10 / 0x11=3 / 0x24=0 / 0x25=2500(0x09C4) / 0x1E=1',
     preset.map(i => A.bytesToHex(i.data)),
     ['00 0A', '00 03', '00', '09 C4', '01']);
  const fr = A.buildFactoryResetPlan();
  eq('E4g 恢复出厂 0x1F=01', A.bytesToHex(fr[0].data), '01');
  /* 每条计划的帧都必须 ≤ 50 B（主机→模组硬上限） */
  let allSendable = true, detail = [];
  for (const it of preset.concat(fr)) {
    try {
      const w = A.createFrame(0xA1, it.type, it.data, 1);
      detail.push('0x' + A.hex2(it.type) + ':' + w.length + 'B');
    } catch (e) { allSendable = false; detail.push('0x' + A.hex2(it.type) + ':拒发'); }
  }
  isTrue('E4h 计划内每一帧都 ≤50 B 可发送', allSendable, detail.join(' '));
}

/* ==========================================================================
 * 四、结论
 * ========================================================================== */
line('');
line('='.repeat(78));
line(`用例表：${res.pass}/${res.total} 通过；额外断言：${checks - 1} 项（不含用例表）`);
if (failures === 0) {
  line('结论：全部通过（退出码 0）');
} else {
  line('结论：失败 ' + failures + ' 项（退出码 1）');
  process.exitCode = 1;
}
line('='.repeat(78));
