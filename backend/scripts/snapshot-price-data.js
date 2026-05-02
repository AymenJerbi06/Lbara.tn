const fs = require('fs');
const path = require('path');

const sourceDir = process.env.PRODUCT_ASSETS_DIR
  ? path.resolve(process.env.PRODUCT_ASSETS_DIR)
  : path.resolve(__dirname, '../../../Assets/products');

const targetDir = path.resolve(__dirname, '../data');

const files = [
  'lbara-product-catalog.xlsx',
  'lbara_pricing_table_v2.html',
];

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing pricing source file: ${source}`);
  }

  fs.copyFileSync(source, target);
  console.log(`[OK] ${file} -> ${path.relative(process.cwd(), target)}`);
}
