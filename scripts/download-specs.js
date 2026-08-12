/**
 * 批量下载模组产品线规格书 PDF
 * 从钉钉知识库「规格书」目录 → 各系列 → 各型号 → 规格书子目录
 * 下载中文版常规版规格书，重命名为 {型号}.pdf
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SPACE_ID = 'VJqzqxdrylYWKGYE';
const SPEC_ROOT_ID = 'amweZ92PV6vjMOXoUKKqjpKNVxEKBD6p'; // 规格书根目录
const PDF_DIR = path.resolve(__dirname, '..', 'static', 'pdf');

function dws(args) {
  try {
    return JSON.parse(execSync(`dws ${args}`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }));
  } catch (e) {
    return null;
  }
}

function listNodes(folderId) {
  const r = dws(`wiki node list --workspace ${SPACE_ID} --folder ${folderId} --format json`);
  return r?.nodes || [];
}

// 系列目录映射：文件夹名 → 频段
const SERIES_MAP = {
  'EDC系列（5.8GHz）': '5.8GHz',
  'EDX系列（10GHz）': '10.5GHz',
  'EDQ系列（24GHz）': '24GHz',
  'EDV系列（60GHz）': '60GHz',
};

function main() {
  fs.mkdirSync(PDF_DIR, { recursive: true });

  console.log('📋 扫描规格书目录...\n');
  const seriesFolders = listNodes(SPEC_ROOT_ID).filter(n => n.nodeType === 'folder');

  let downloaded = 0;
  let skipped = 0;

  for (const series of seriesFolders) {
    if (!SERIES_MAP[series.name]) continue; // 跳过非产品系列目录
    const band = SERIES_MAP[series.name];
    console.log(`\n📁 ${series.name}`);

    // 遍历该系列下的型号目录
    const modelFolders = listNodes(series.nodeId).filter(n => n.nodeType === 'folder');
    for (const modelFolder of modelFolders) {
      const modelName = modelFolder.name.replace('系列', '').trim();

      // 找「规格书」子目录
      const subNodes = listNodes(modelFolder.nodeId);
      const specDir = subNodes.find(n => n.name === '规格书' && n.nodeType === 'folder');

      let pdfs = [];
      if (specDir) {
        pdfs = listNodes(specDir.nodeId).filter(n => n.extension === 'pdf');
      } else {
        // 有些型号的 PDF 直接放在型号目录下
        pdfs = subNodes.filter(n => n.extension === 'pdf');
      }

      if (pdfs.length === 0) {
        console.log(`  ⚠️ ${modelName}: 无规格书 PDF`);
        skipped++;
        continue;
      }

      // 优先选中文常规版，否则第一个中文 PDF
      let pdf = pdfs.find(p => p.name.includes('常规版') && !p.name.includes('Specification') && !p.name.includes('version')) ;
      if (!pdf) pdf = pdfs.find(p => !p.name.includes('Specification') && !p.name.includes('version'));
      if (!pdf) pdf = pdfs[0];

      // 规范化文件名：{型号}.pdf（小写，仅字母数字）
      const safeName = modelName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.pdf';
      const outputPath = path.join(PDF_DIR, safeName);

      // 已存在则跳过
      if (fs.existsSync(outputPath)) {
        console.log(`  ⏭️  ${modelName}: 已下载`);
        skipped++;
        continue;
      }

      // 下载
      console.log(`  📥 ${modelName}: 下载 ${pdf.name}...`);
      try {
        execSync(`dws drive download --node "${pdf.nodeId}" --output "${outputPath}"`, {
          encoding: 'utf-8', stdio: 'pipe', timeout: 60000,
        });
        const size = fs.statSync(outputPath).size;
        console.log(`  ✅ ${safeName} (${Math.round(size / 1024)}KB)`);
        downloaded++;
      } catch (e) {
        console.log(`  ❌ ${modelName}: 下载失败`);
        skipped++;
      }
    }
  }

  console.log(`\n🎉 完成！下载 ${downloaded} 个，跳过 ${skipped} 个`);
  console.log(`PDF 目录: static/pdf/ (${fs.readdirSync(PDF_DIR).filter(f=>f.endsWith('.pdf')).length} 个文件)`);
}

main();
