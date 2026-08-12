#!/usr/bin/env node
/**
 * 钉钉产品知识库 → Docusaurus 文档自动同步脚本
 *
 * 用法：
 *   node scripts/sync-from-dingtalk.js
 *
 * 功能：
 *   1. 通过 dws CLI 从钉钉知识库读取产品清单表格
 *   2. 自动生成/更新各产品线的 Markdown 文档
 *   3. 文档人员只需在钉钉更新表格，跑此脚本即可同步到站点
 *
 * 前提：
 *   - 已安装 dws CLI（npm install -g dingtalk-workspace-cli）
 *   - 已登录（dws auth login）
 *   - 钉钉产品知识库访问权限已授权
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ===== 配置 =====
const CONFIG = {
  // 钉钉产品知识库 spaceId
  wikiSpaceId: 'VJqzqxdrylYWKGYE',
  // 产品清单 nodeId
  productListNodeId: 'jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz',
  // 各产品线表格的 nodeId + 目标目录
  sources: [
    {
      name: '模组',
      nodeId: 'r1R7q3QmWe7yelaniN77o5P2JxkXOEP2',
      sheetId: 'kgqie6hm',
      targetDir: 'modules_docs',
      groupField: 'band', // 按频段分组
    },
    {
      name: '独立传感器',
      nodeId: '14lgGw3P8vvQRw5dUg2exAlg85daZ90D',
      sheetId: 'kgqie6hm',
      targetDir: 'sensors_docs',
      groupField: 'protocol', // 按协议分组
    },
    {
      name: '配件',
      nodeId: 'gwva2dxOW4KgYkN5fk4k6Owa8bkz3BRL',
      sheetId: 'kgqie6hm',
      targetDir: 'accessories_docs',
      groupField: null,
    },
  ],
};

// ===== 工具函数 =====

function run(cmd) {
  return execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
}

function dws(args) {
  return JSON.parse(run(`dws ${args}`));
}

/**
 * 从钉钉表格读取数据，返回行列数组（仅值，不含样式）
 */
function readSheet(nodeId, sheetId, range = 'A1:Z100') {
  const result = dws(
    `sheet range read --node ${nodeId} --sheet-id ${sheetId} --range ${range} --format json`
  );
  if (!result.cells) return [];
  return result.cells.map((row) => row.map((cell) => cell.value || ''));
}

/**
 * 解析表格数据为产品对象数组
 */
function parseProducts(rows, type) {
  // 找表头行（含"型号"关键字的行）
  let headerIdx = rows.findIndex((r) =>
    r.some((c) => c.includes('型号') || c.includes('model'))
  );
  if (headerIdx === -1) return [];

  let headers = rows[headerIdx].map((h) => h.trim());
  // 找到型号列的索引（不硬编码，从表头找）
  let modelColIdx = headers.findIndex((h) => h.includes('型号') || h.toLowerCase().includes('model'));
  if (modelColIdx === -1) modelColIdx = 0; // 回退到第 1 列

  const products = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // 检测频段分隔行（如"5.8G模块型号"），更新表头
    const firstCell = (row[0] || '').trim();
    if (firstCell.includes('GHz') || firstCell.includes('配件')) {
      // 这一行的其他列可能是新表头
      const newHeaders = row.map((h) => (h || '').trim());
      if (newHeaders.some((h) => h.includes('型号'))) {
        headers = newHeaders;
        modelColIdx = headers.findIndex((h) => h.includes('型号'));
        if (modelColIdx === -1) modelColIdx = 0;
      }
      continue;
    }

    const model = (row[modelColIdx] || '').trim();
    // 跳过空行、表头重复行
    if (!model || model.includes('型号')) continue;
    // 跳过非型号（型号通常含字母+数字，如 EDC116、EDQ55G）
    if (!/[A-Za-z]{2,}/.test(model) || !/\d/.test(model)) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key) obj[key] = (row[j] || '').trim();
    }
    obj._model = model;
    products.push(obj);
  }

  return products;
}

/**
 * 生成单个产品的 Markdown 文档
 */
function generateDoc(product, type) {
  const model = product._model;
  const get = (keys) => {
    for (const k of keys) {
      for (const realKey of Object.keys(product)) {
        if (realKey.includes(k)) return product[realKey];
      }
    }
    return '';
  };

  const feature = get(['特点', '主要特点', 'feature']) || '';
  const band = get(['频段', '工作频段', 'band']) || '';
  const func = get(['产品功能', '感应距离', 'function']) || '';
  const output = get(['输出方式', 'output']) || '';
  const vin = get(['输入电压', 'vin']) || '';
  const vout = get(['输出电压', 'vout']) || '';
  const size = get(['尺寸', 'size']) || '';
  const market = get(['细分市场', '市场', 'market']) || '';
  const mount = get(['安装方式', 'mount']) || '';
  const scene = get(['应用场景', 'scene']) || '';
  const status = get(['产品状态', 'status']) || '';
  const sense = get(['感应方式', 'sense']) || '';
  const tune = get(['调参方式', 'tune']) || '';

  const statusBadge = status
    ? status.includes('量产')
      ? '✅ 正式量产'
      : '🔧 研发测试'
    : '';

  const typeLabel = type === 'sensors' ? '独立传感器' : type === 'accessories' ? '配件' : '模组';

  let md = `---\nsidebar_position: 1\n---\n\n# ${model}\n\n> ${feature}｜${band ? band + ' ' : ''}${typeLabel}${statusBadge ? '｜' + statusBadge : ''}\n\n## 核心特点\n\n${feature || '详见规格书'}\n\n## 规格参数\n\n| 参数 | 规格 |\n|------|------|\n`;
  if (band) md += `| 工作频段 | ${band} |\n`;
  if (sense) md += `| 感应方式 | ${sense} |\n`;
  if (func) md += `| 感应距离 | ${func} |\n`;
  if (output) md += `| 输出方式 | ${output} |\n`;
  if (vin) md += `| 输入电压 | ${vin} |\n`;
  if (vout) md += `| 输出电压 | ${vout} |\n`;
  if (tune) md += `| 调参方式 | ${tune} |\n`;
  if (size) md += `| 外形尺寸 | ${size} |\n`;
  if (status) md += `| 产品状态 | ${status} |\n`;

  if (market || mount || scene) {
    md += `\n## 应用信息\n\n| 项目 | 说明 |\n|------|------|\n`;
    if (market) md += `| 细分市场 | ${market} |\n`;
    if (mount) md += `| 安装方式 | ${mount} |\n`;
    if (scene) md += `| 应用场景 | ${scene} |\n`;
  }

  md += `\n:::info 规格书\n完整规格书请从[产品知识库](https://alidocs.dingtalk.com/i/nodes/jb9Y4gmKWr7QPe5kijjeBnmQVGXn6lpz)获取，或联系 support@easydetek.com。\n:::\n`;

  return md;
}

// ===== 主流程 =====

function main() {
  console.log('🔄 开始从钉钉知识库同步产品数据...\n');

  // 检查 dws 登录状态
  try {
    const auth = dws('auth status');
    if (!auth.authenticated) {
      console.error('❌ 未登录钉钉，请先运行: dws auth login');
      process.exit(1);
    }
    console.log(`✅ 已登录: ${auth.corp_name} / ${auth.user_name}\n`);
  } catch (e) {
    console.error('❌ 无法检查登录状态，请确认 dws CLI 已安装并登录');
    process.exit(1);
  }

  let totalGenerated = 0;

  for (const source of CONFIG.sources) {
    console.log(`\n📋 读取「${source.name}」清单...`);
    try {
      const rows = readSheet(source.nodeId, source.sheetId);
      if (rows.length === 0) {
        console.log(`  ⚠️ 未读取到数据，跳过`);
        continue;
      }

      const products = parseProducts(rows, source.targetDir);
      console.log(`  📊 解析到 ${products.length} 款产品`);

      if (products.length === 0) {
        console.log(`  ⚠️ 无有效产品数据，跳过`);
        continue;
      }

      // 生成文档（只更新产品页，不删现有文件）
      let count = 0;
      for (const product of products) {
        const filename = product._model.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
        const md = generateDoc(product, source.targetDir);
        // 尝试在子目录中找已有文件位置（保持分组结构）
        const targetDir = path.resolve(source.targetDir);
        const possiblePaths = [
          path.join(targetDir, filename), // 根目录
          ...fs.existsSync(targetDir)
            ? fs.readdirSync(targetDir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => path.join(targetDir, d.name, filename))
            : [], // 子目录
        ];
        const existingPath = possiblePaths.find((p) => fs.existsSync(p));
        const outputPath = existingPath || path.join(targetDir, filename);
        if (existingPath) {
          fs.writeFileSync(existingPath, md);
          count++;
        } else {
          // 新产品，放根目录（后续手动归类到分组）
          fs.writeFileSync(outputPath, md);
          count++;
          console.log(`  🆕 新产品: ${product._model} → ${path.relative('.', outputPath)}`);
        }
      }

      console.log(`  ✅ 已更新 ${count} 个文档`);
      totalGenerated += count;
    } catch (e) {
      console.error(`  ❌ 读取失败: ${e.message}`);
    }
  }

  console.log(`\n🎉 同步完成！共更新 ${totalGenerated} 个产品文档`);
  console.log(`\n下一步：`);
  console.log(`  1. 检查新产品是否需要归类到子目录（频段/协议分组）`);
  console.log(`  2. 重建站点: docker compose -f docker-compose.local.yml up -d --build`);
}

main();
