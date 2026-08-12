/**
 * 在模组产品文档底部加 FAQ 交叉链接
 */
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.resolve(__dirname, '..', 'modules_docs');

// 按频段推荐 FAQ
const FAQ_BY_BAND = {
  '5.8GHz': ['frequency-selection', 'microwave-vs-pir', 'installation', 'power-wiring'],
  '10.5GHz': ['frequency-selection', 'installation', 'power-wiring'],
  '24GHz': ['frequency-selection', 'microwave-vs-pir', 'installation'],
  '60GHz': ['frequency-selection', 'microwave-vs-pir', 'installation'],
};

const FAQ_TITLES = {
  'frequency-selection': '如何选择频段',
  'microwave-vs-pir': '微波 vs 红外区别',
  'installation': '安装注意事项',
  'power-wiring': '供电与接线',
  'certification': '认证与合规',
  'module-vs-sensor': '模组 vs 成品传感器',
  'uart-protocol': '串口协议',
  'smart-home-integration': '智能家居接入',
};

function genFaqLinks(band) {
  const faqs = FAQ_BY_BAND[band] || FAQ_BY_BAND['5.8GHz'];
  const links = faqs.map(f =>
    `- [${FAQ_TITLES[f]}](/docs/faq/${getCategory(f)}/${f})`
  ).join('\n');
  return `\n## 相关 FAQ\n\n${links}\n`;
}

function getCategory(slug) {
  const general = ['microwave-vs-pir', 'installation', 'power-wiring', 'certification'];
  const selection = ['frequency-selection', 'module-vs-sensor'];
  if (general.includes(slug)) return '通用问题';
  if (selection.includes(slug)) return '模组选型';
  return '对接开发';
}

function processDir(dir, band) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 子目录名可能是频段
      const subBand = ['5.8GHz', '10.5GHz', '24GHz', '60GHz'].includes(entry.name) ? entry.name : band;
      count += processDir(fullPath, subBand);
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'intro.md') {
      if (!band) continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      // 移除旧的 FAQ 块
      content = content.replace(/\n## 相关 FAQ\n[\s\S]*$/m, '');
      // 追加
      content = content.trimEnd() + genFaqLinks(band);
      fs.writeFileSync(fullPath, content);
      count++;
    }
  }
  return count;
}

const count = processDir(MODULES_DIR, null);
console.log(`✅ 为 ${count} 个产品文档添加了 FAQ 交叉链接`);
