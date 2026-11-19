#!/usr/bin/env node
/**
 * scripts/edv163_presence_selftest.mjs
 * ---------------------------------------------------------------------------
 * 「EDK60 + EDV163-N-03 人体存在检测」网页演示页的无浏览器自测（协议 V1.4 口径）。
 *
 * 做法（关键）：不在本文件里重写一份解析器，而是从
 *   static/edk60/edv163-presence/presence.html
 * 里抽出三段标记区间：
 *   // ==== CFG-BEGIN ==== … // ==== CFG-END ====      协议常量 / 时序 / 默认值
 *   // ==== CORE-BEGIN ==== … // ==== CORE-END ====    校和 / 组帧 / 增量切帧 / 0x81 / 参数编解码 / 静默口径
 *   // ==== CASES-BEGIN ==== … // ==== CASES-END ====   16 条自测用例与用例运行器
 * 然后把它们拼进 new Function 里求值 —— 断言的就是页面「运行页内自测」跑的同一份实现
 * 与同一张用例表。页面里的解析器若被改坏，这里必然一起红。
 *
 * 协议口径（V1.4，唯一权威）：
 *   帧 = 45 44 | 长度(2)=11+N | msgid(2) | op(1) | type(1) | len(2)=N | Value(N) | 校验和(1)
 *   · 没有帧尾 0x0A；不做字节填充（Value 里的 0x09/0x0A 保持原值）
 *   · 校验和 = sum(data[0:-1]) & 0xFF
 *   · 0x81 = 固定 9 B 单目标，X/Y 为 int16、Z 为 uint16
 *   · 没有「主机→模组 50 B 上限」：SET 0x29 ×10 = 142 B 合法
 *
 * 额外回归（页面用例之外）：
 *   E1 0x81 逐字节偏移（9 B 单目标；18 B 必须判载荷长度异常）
 *   E2 int16 / uint16 边界（FF FF、80 00、7F FF）
 *   E3 官方 39 条示例帧的「长度域 == 实际帧长 == 11+Value」与校验和自洽
 *   E4 只读计划 13 条 GET / 演示 SET 5 条 / 142 B 帧 / 无 50 B 闸
 *   E5 源码级检查：V1.1 的字节填充、「口径歧义」等概念已彻底移除
 *   E6 静默窗与「静默 ≠ 故障」的两态独立性（另一组数值）
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
line('EDV163-N-03 人体存在检测演示页 · 无浏览器自测（协议 V1.4）');
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
isTrue('CORE 段含 parseMaskZones / packMaskZones（0x29）',
       /function\s+parseMaskZones/.test(coreSrc) && /function\s+packMaskZones/.test(coreSrc));
isTrue('CORE 段含 parseDetectRange / packDetectRange（0x27）',
       /function\s+parseDetectRange/.test(coreSrc) && /function\s+packDetectRange/.test(coreSrc));
isTrue('CASES 段含 SELFTEST_CASES', /const\s+SELFTEST_CASES/.test(casesSrc));
isTrue('CASES 段含官方示例帧表 OFFICIAL_FRAMES', /const\s+OFFICIAL_FRAMES/.test(casesSrc));

const factoryBody = [
  cfgSrc,
  coreSrc,
  casesSrc,
  `return { CFG, P, checksum, createFrame, nextMsgId, EdvParser, unattributedBytes,`,
  `  parseReport81, buildReport81Payload, readInt16BE, readUint16BE, pushInt16BE, pushUint16BE,`,
  `  hexToBytes, bytesToHex, concatBytes, hex2, hex4, bytesEqual, asciiOf,`,
  `  encodeUint16, encodeInt16, parseDetectRange, packDetectRange, parseMaskZones, packMaskZones,`,
  `  decodeParam, assertSetValue, buildSetFrame, buildReadPlan, buildPresetPlan,`,
  `  buildFactoryResetPlan, buildForceLeavePlan, buildLearnPlan, buildLearnExitPlan,`,
  `  buildLearnRestorePlan, silenceWindowMs, evaluatePresence, evaluateLink, pct1, fmtSec,`,
  `  checker, feedAll, t81, OFFICIAL_FRAMES, officialStream, SELFTEST_CASES, runSelftestCases };`
].join('\n');

let A;
try {
  A = new Function(factoryBody)();
  ok('new Function 求值页面真实代码', 'CFG + CORE + CASES 共 ' +
     (cfgSrc.length + coreSrc.length + casesSrc.length) + ' 字符');
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
eq('用例总数 = 16', res.total, 16);

/* ==========================================================================
 * 三、额外回归
 * ========================================================================== */
line('');
line('三、额外回归（页面用例之外）');

/* --- E1：0x81 逐字节偏移（V1.4 固定 9 B 单目标，没有通道概念） --- */
{
  const data = A.hexToBytes('01 02 01 0A 09 FF 9C 01 F4');
  const rep = A.parseReport81(data);
  eq('E1a 0x81 载荷固定 9 B', data.length, 9);
  eq('E1b stride = 9', rep.stride, 9);
  isTrue('E1c 不再有 channels 数组（V1.4 无通道概念）', rep.channels === undefined,
         'rep.channels = ' + JSON.stringify(rep.channels));
  const t = rep.target;
  eq('E1d offset0 presence', t.presence, data[0]);
  eq('E1e offset1 state', t.state, data[1]);
  eq('E1f offset2 direction', t.direction, data[2]);
  eq('E1g offset3-4 x (int16 BE)', t.x, (data[3] << 8) | data[4]);
  eq('E1h offset5-6 y (int16 BE)',
     t.y, (((data[5] << 8) | data[6]) > 32767 ? (((data[5] << 8) | data[6]) - 65536)
                                              : ((data[5] << 8) | data[6])));
  eq('E1i offset7-8 z (uint16 BE, 无符号)', t.z, (data[7] << 8) | data[8]);
  eq('E1j 具体取值', [t.presence, t.state, t.direction, t.x, t.y, t.z],
     [1, 2, 1, 2569, -100, 500]);
  const eighteen = A.parseReport81(A.hexToBytes('01 02 01 00 64 00 C8 05 DC 01 02 01 00 64 00 C8 05 DC'));
  eq('E1k 18 B 判载荷长度异常（不再按 tlv_len/9 推通道数）', eighteen.ok, false);
  isTrue('E1l 异常信息里带原始十六进制',
         /载荷长度异常/.test(eighteen.error || '') && /01 02 01 00 64/.test(eighteen.error || ''),
         eighteen.error);
}

/* --- E2：int16 / uint16 边界 --- */
{
  const cases = ['FF FF', '80 00', '7F FF', '00 00', '09 C4'];
  const i16 = cases.map(h => A.readInt16BE(A.hexToBytes(h), 0));
  const u16 = cases.map(h => A.readUint16BE(A.hexToBytes(h), 0));
  eq('E2a readInt16BE 边界', i16, [-1, -32768, 32767, 0, 2500]);
  eq('E2b readUint16BE 边界', u16, [65535, 32768, 32767, 0, 2500]);
  const z = A.buildReport81Payload(A.t81(1, 1, 0, 0, 0, 65535));
  eq('E2c buildReport81Payload 保留 Z=65535', A.bytesToHex(z), '01 01 00 00 00 00 00 FF FF');
  eq('E2d Z 往返仍是 65535', A.parseReport81(z).target.z, 65535);
  const neg = A.buildReport81Payload(A.t81(1, 1, 0, -3000, -1, 0));
  eq('E2e 负 X/Y 编码', A.bytesToHex(neg), '01 01 00 F4 48 FF FF 00 00');
}

/* --- E3：官方 39 条示例帧的长度域与校验和自洽 --- */
{
  const rows = A.OFFICIAL_FRAMES;
  eq('E3a 官方示例帧条数（39 条 = 19 组主机+应答 + 1 条 0x81 主动上报）', rows.length, 39);
  let allLen = true, allCk = true, allRegen = true;
  const badLen = [], badCk = [], badGen = [];
  for (const [op, type, v, f] of rows) {
    const bytes = A.hexToBytes(f);
    const valueLen = A.hexToBytes(v).length;
    const lenField = (bytes[2] << 8) | bytes[3];
    if (lenField !== bytes.length || lenField !== 11 + valueLen) {
      allLen = false;
      badLen.push('0x' + A.hex2(type) + '/' + A.hex2(op) + ' 声明 ' + lenField +
                  ' / 实际 ' + bytes.length + ' / 应 ' + (11 + valueLen));
    }
    if (A.checksum(bytes, 0, bytes.length - 1) !== bytes[bytes.length - 1]) {
      allCk = false;
      badCk.push('0x' + A.hex2(type) + '/' + A.hex2(op));
    }
    const gen = A.bytesToHex(A.createFrame(op, type, A.hexToBytes(v), 0x0001));
    if (gen !== f) { allRegen = false; badGen.push('0x' + A.hex2(type) + ' 生成 ' + gen); }
  }
  isTrue('E3b 全部帧「长度域 == 实际帧长 == 11 + Value」', allLen, badLen.join('；') || '39/39');
  isTrue('E3c 全部帧校验和 = sum(data[0:-1]) 末字节', allCk, badCk.join('；') || '39/39');
  isTrue('E3d 全部帧可由 createFrame 逐字节重生成', allRegen, badGen.join('；') || '39/39');

  /* 帧头 45 44 + 长度字段即可切帧：整段拼起来解出 39 条 */
  const stream = A.officialStream();
  const p = new A.EdvParser();
  const frames = A.feedAll(p, [stream]);
  eq('E3e 官方 39 条流整段解出帧数', frames.length, 39);
  eq('E3f 整段流无坏帧', p.badFrames, 0);
  eq('E3g 整段流无未归属字节', A.unattributedBytes(p, stream.length), 0);
  eq('E3h Value 含 45 44 的那条 0x01 Report 的 Value',
     A.bytesToHex(frames[1].data), '00 45 44');
}

/* --- E4：只读计划 / 演示 SET / 142 B 帧 / 无 50 B 闸 --- */
{
  const plan = A.buildReadPlan();
  eq('E4a 只读计划条数 = 13', plan.length, 13);
  eq('E4b 只读计划全部 op=0xA0（零 SET）', plan.every(p => p.op === 0xA0), true);
  eq('E4c 只读计划 type 顺序（事实包 §6）', plan.map(p => '0x' + A.hex2(p.type)),
     ['0x01', '0x02', '0x12', '0x17', '0x18', '0x1B', '0x1D', '0x23', '0x24',
      '0x25', '0x26', '0x27', '0x29']);
  isTrue('E4d 只读计划里不得出现 0x13 / 0x11 / 0x1E 等 V1.1 命令',
         plan.every(p => [0x13, 0x11, 0x1E, 0x04, 0x14, 0x15, 0x16, 0x19, 0x1C, 0x80]
           .indexOf(p.type) < 0), plan.map(p => '0x' + A.hex2(p.type)).join(' '));

  const preset = A.buildPresetPlan();
  eq('E4e 演示推荐 SET 条数 = 5', preset.length, 5);
  eq('E4f 演示推荐 type 顺序', preset.map(i => '0x' + A.hex2(i.type)),
     ['0x17', '0x12', '0x24', '0x25', '0x18']);
  eq('E4g 演示推荐 Value', preset.map(i => A.bytesToHex(i.data)),
     ['00 0A', '00 01', '00', '09 C4', '01']);

  /* 142 B：SET 0x29 ×10 必须能发出去 */
  const zones = [];
  for (let i = 1; i <= 10; i++) {
    zones.push({ id: i, minX: -3000, maxX: 3000, minY: -3000, maxY: 3000, minZ: 0, maxZ: 2000 });
  }
  const maskPayload = A.packMaskZones(zones);
  eq('E4h 0x29 ×10 的 Value 长度 = 1+13×10', maskPayload.length, 131);
  const big = A.buildSetFrame(0x29, maskPayload, 0x0001);
  eq('E4i 整帧 = 11 + 131 = 142 B', big.length, 142);
  eq('E4j 长度域 = 142', (big[2] << 8) | big[3], 142);
  isTrue('E4k 142 B > 50 B 也能发出（V1.4 无 50 B 限制）', big.length > 50, big.length + ' B');
  isTrue('E4l 页面里已无 maxHostPayloadLen（旧 50 B 闸）',
         typeof A.maxHostPayloadLen === 'undefined' &&
         !/maxHostPayloadLen/.test(coreSrc), 'typeof=' + typeof A.maxHostPayloadLen);
}

/* --- E5：源码级检查 —— V1.1 的字节填充 / 口径歧义等概念彻底移除 --- */
{
  const forbidden = ['escapeBytes', 'unescapeBytes', '口径歧义', 'maxHostFrameLength',
                     'maxHostPayloadLen', 'buildUnescapedFrame', 'parseReport80'];
  const hits = forbidden.filter(k => coreSrc.indexOf(k) >= 0 || casesSrc.indexOf(k) >= 0);
  eq('E5a CORE/CASES 段不含 V1.1 遗留标识符', hits, []);
  isTrue('E5b CFG.proto 里没有帧尾字段 tail', A.CFG.proto.tail === undefined,
         'tail=' + A.CFG.proto.tail);
  eq('E5c 最小帧长 = 11（11 + N 口径）', A.P.minFrameLength, 11);
  eq('E5d 帧头 = 45 44', A.CFG.proto.header, [0x45, 0x44]);
  eq('E5e 0x81 载荷长度常量 = 9', A.P.report81Len, 9);
  eq('E5f 屏蔽区上限 = 10', A.P.maskMax, 10);
  isTrue('E5g 组帧结果里不含 0x0A 帧尾（长度 11+N 且末字节 = 校验和）',
         (() => {
           const w = A.createFrame(0xA0, 0x01, null, 0x0001);
           return w.length === 11 && w[w.length - 1] === A.checksum(w, 0, w.length - 1);
         })(), '');
  isTrue('E5h Value 里的 0x0A / 0x09 原值写进帧（无填充膨胀）',
         (() => {
           const w = A.createFrame(0xA1, 0x17, A.hexToBytes('00 0A'), 0x0001);
           return w.length === 13 && A.bytesToHex(w) === '45 44 00 0D 00 01 A1 17 00 02 00 0A 5B';
         })(), '');
}

/* --- E6：静默窗与「静默 ≠ 故障」两态独立（另一组数值） --- */
{
  eq('E6a 静默窗（0x17 = 50 → 15000 ms）', A.silenceWindowMs(50), 15000);
  eq('E6b 静默窗（0x17 = 10 → max(3000, 8000) = 8000 ms）', A.silenceWindowMs(10), 8000);
  eq('E6c 静默窗（未回读 → 协议默认 50）', A.silenceWindowMs(undefined), 15000);
  const ev = A.evaluatePresence(30000, { at: 1000, presence: 1 }, 10);
  eq('E6d 超窗 → 按静默推断', [ev.basis, ev.presence, ev.silent], ['silence', 0, true]);
  isTrue('E6e 文案含「按静默推断」', /按静默推断/.test(ev.basisText), ev.basisText);
  const link = A.evaluateLink(30000, { connected: true, totalBytes: 4096, frames: 3,
                                       badFrames: 0, period100ms: 10, openedAt: 0 });
  eq('E6f 静默期间链路仍判「正常」（不是故障）', [link.fault, link.faultText], ['none', '正常']);
  const noFrames = A.evaluateLink(30000, { connected: true, totalBytes: 4096, frames: 0,
                                           badFrames: 0, period100ms: 10, openedAt: 0 });
  eq('E6g 一个合法帧都没有才算故障', noFrames.fault, 'no-data');
  const inWin = A.evaluatePresence(5000, { at: 1000, presence: 1 }, 50);
  eq('E6h 静默窗内按真帧', [inWin.basis, inWin.word], ['frame', '有人']);
}

/* ==========================================================================
 * 四、结论
 * ========================================================================== */
line('');
line('='.repeat(78));
line(`用例表：${res.pass}/${res.total} 通过；额外断言：${checks - 1 - 1} 项（不含用例表）`);
if (failures === 0) {
  line('结论：全部通过，退出码 0');
} else {
  line('结论：失败 ' + failures + ' 项，退出码 1');
  process.exitCode = 1;
}
line('='.repeat(78));
