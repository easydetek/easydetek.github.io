/**
 * 批量给产品文档 frontmatter 补 title 字段（从正文 H1 提取）
 * 让 CMS 列表显示正确的型号名
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['modules_docs', 'sensors_docs', 'accessories_docs', 'opensource_docs', 'docs'];

function processDir(dir) {
  let updated = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updated += processDir(fp);
    } else if (entry.name.endsWith('.md') && entry.name !== 'intro.md' && !entry.name.startsWith('_')) {
      let content = fs.readFileSync(fp, 'utf8');

      // 已有 title 则跳过
      if (/^title:\s*.+$/m.test(content.split('---')[1] || '')) continue;

      // 从正文提取 H1
      const h1 = content.match(/^#\s+(.+)$/m);
      if (!h1) continue;
      const title = h1[1].trim();

      // 在 frontmatter 第一行后插入 title
      content = content.replace(/^---\n/, `---\ntitle: "${title}"\n`);
      fs.writeFileSync(fp, content);
      updated++;
      console.log(`  ✅ ${path.relative(ROOT, fp)}: title="${title}"`);
    }
  }
  return updated;
}

let total = 0;
for (const d of DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) {
    console.log(`\n📁 ${d}/`);
    total += processDir(full);
  }
}
console.log(`\n🎉 完成！共为 ${total} 个文档补充 title`);
