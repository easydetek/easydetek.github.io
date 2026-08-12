/**
 * 遍历模组产品文档，匹配对应的规格书 PDF，在文档底部加下载链接
 */
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.resolve(__dirname, '..', 'modules_docs');
const PDF_DIR = path.resolve(__dirname, '..', 'static', 'pdf');

// 获取所有 PDF 文件名（不含 .pdf 后缀，小写）
const pdfs = new Set(
  fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .map(f => f.replace(/\.pdf$/, '').toLowerCase())
);

// 规格书链接模板
function specLink(model) {
  const slug = model.toLowerCase().replace(/[^a-z0-9]/g, '-');
  if (!pdfs.has(slug)) return null;
  return `## 规格书下载

📄 [${model} 规格书 PDF](/pdf/${slug}.pdf)
`;
}

// 遍历 modules_docs 下所有子目录的 .md 文件
function processDir(dir) {
  let updated = 0;
  let linked = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = processDir(fullPath);
      updated += result.updated;
      linked += result.linked;
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'intro.md') {
      // 从文件名提取型号（如 edc116.md → EDC116）
      const baseName = entry.name.replace(/\.md$/, '');
      const model = baseName.toUpperCase();

      const linkBlock = specLink(model);
      if (!linkBlock) continue;

      let content = fs.readFileSync(fullPath, 'utf8');

      // 移除旧的规格书 info 块（避免重复）
      content = content.replace(/:::info 规格书[\s\S]*?:::\n*/g, '');

      // 如果已有「规格书下载」块，跳过
      if (content.includes('## 规格书下载')) continue;

      // 追加规格书下载链接
      content = content.trimEnd() + '\n\n' + linkBlock;
      fs.writeFileSync(fullPath, content);
      linked++;
      updated++;
      console.log(`  ✅ ${model}: 加规格书链接`);
    }
  }
  return { updated, linked };
}

console.log('📄 为产品文档添加规格书下载链接...\n');
const { updated, linked } = processDir(MODULES_DIR);
console.log(`\n🎉 完成！为 ${linked} 个产品文档添加了规格书下载链接`);
console.log(`（共 ${pdfs.size} 个 PDF 可用）`);
