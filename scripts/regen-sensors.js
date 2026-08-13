/**
 * 重新生成传感器产品文档（修复数据缺失）
 * 从钉钉表格读取 → 正确映射列 → 生成完整文档
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NODE_ID = '14lgGw3P8vvQRw5dUg2exAlg85daZ90D';
const SHEET_ID = 'kgqie6hm';
const SENSORS_DIR = path.resolve(__dirname, '..', 'sensors_docs');

// 分组映射：型号 → 子目录
const GROUP_MAP = {
  // AC强电
  'EDC287-Y-02':'AC强电', 'EDC211D':'AC强电', 'EDQ252-Y-04':'AC强电',
  'EDQ282-Y-03':'AC强电', 'EDQ25L-Y-01':'AC强电', 'EDQ253-S-01':'AC强电', 'EDQ25S-M':'AC强电',
  // Tuya(涂鸦)
  'EDQ253-Y-03':'Tuya(涂鸦)', 'EDQ251-T-Z':'Tuya(涂鸦)', 'EDQ201-T-01':'Tuya(涂鸦)', 'EDV25P-T-02':'Tuya(涂鸦)',
  // Mijia(米家)
  'EDQ25M-Y-01':'Mijia(米家)', 'EDQ201-M-01':'Mijia(米家)',
  // BLE蓝牙
  'EDQ286B':'BLE蓝牙', 'EDQ251-G-01':'BLE蓝牙', 'EDQ25S-G-01':'BLE蓝牙',
  // DC干接点
  'EDC286-Y-06':'DC干接点', 'EDQ286-Y-06':'DC干接点',
  // 60GHz康养
  'EDV28A':'60GHz康养', 'EDV21C-W-01':'60GHz康养',
};

function readSheet() {
  const raw = execSync(
    `dws sheet range read --node ${NODE_ID} --sheet-id ${SHEET_ID} --range A1:L25`,
    { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
  );
  const j = JSON.parse(raw);
  if (!j.cells) return [];
  return j.cells.map(row => row.map(c => c.value || ''));
}

function parseProducts(rows) {
  // 表头在行1-2，数据从行3（index 2）开始
  // 列: 1=型号 2=新命名 3=状态 4=频段 5=感应方式 6=输入电压 7=输出方式 8=调参方式 9=安装方式 10=特点 11=目标客户
  const products = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const model = (r[1] || '').trim();
    if (!model || model.includes('型号')) continue;
    if (!/[A-Za-z]{2,}/.test(model) || !/\d/.test(model)) continue;
    products.push({
      model,
      alias: (r[2] || '').trim(),
      status: (r[3] || '').trim(),
      band: (r[4] || '').trim(),
      sense: (r[5] || '').trim(),
      vin: (r[6] || '').trim(),
      output: (r[7] || '').trim(),
      tune: (r[8] || '').trim(),
      mount: (r[9] || '').trim(),
      feature: (r[10] || '').trim().replace(/\n/g, '，'),
      market: (r[11] || '').trim(),
    });
  }
  return products;
}

function genDoc(p) {
  const statusBadge = p.status.includes('量产') ? '✅ 正式量产' : '🔧 研发测试';
  let md = `---\nsidebar_position: 1\n---\n\n# ${p.model}\n\n> ${p.feature || p.model}｜${p.band || ''} 独立传感器｜${statusBadge}\n\n## 核心特点\n\n${p.feature || '详见规格书'}\n`;

  if (p.alias && p.alias !== p.model) {
    md += `\n**新命名：** ${p.alias}\n`;
  }

  md += `\n## 规格参数\n\n| 参数 | 规格 |\n|------|------|\n`;
  if (p.band) md += `| 工作频段 | ${p.band} |\n`;
  if (p.sense) md += `| 感应方式 | ${p.sense} |\n`;
  if (p.vin) md += `| 输入电压 | ${p.vin} |\n`;
  if (p.output) md += `| 输出方式 | ${p.output} |\n`;
  if (p.tune) md += `| 调参方式 | ${p.tune} |\n`;
  if (p.mount) md += `| 安装方式 | ${p.mount} |\n`;
  if (p.status) md += `| 产品状态 | ${p.status} |\n`;

  if (p.market) {
    md += `\n## 应用信息\n\n| 项目 | 说明 |\n|------|------|\n`;
    md += `| 目标客户 | ${p.market} |\n`;
  }

  md += `\n## 相关 FAQ\n\n- [如何选择频段](/docs/faq/模组选型/frequency-selection)\n- [安装注意事项](/docs/faq/通用问题/installation)\n- [供电与接线](/docs/faq/通用问题/power-wiring)\n`;

  md += `\n:::info 规格书\n完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz)获取，或联系 support@easydetek.com。\n:::\n`;

  return md;
}

// 主流程
console.log('🔄 读取钉钉传感器数据...');
const rows = readSheet();
console.log(`  📊 读取到 ${rows.length} 行原始数据`);

const products = parseProducts(rows);
console.log(`  📋 解析到 ${products.length} 款产品\n`);

let count = 0;
for (const p of products) {
  const group = GROUP_MAP[p.model];
  if (!group) {
    console.log(`  ⚠️ ${p.model}: 无分组映射，跳过`);
    continue;
  }
  const filename = p.model.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
  const dir = path.join(SENSORS_DIR, group);
  const filePath = path.join(dir, filename);

  const md = genDoc(p);
  fs.writeFileSync(filePath, md);
  console.log(`  ✅ ${p.model} → ${group}/${filename}`);
  count++;
}

console.log(`\n🎉 完成！更新 ${count} 个传感器文档`);
