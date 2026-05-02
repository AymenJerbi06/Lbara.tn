import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { catalog } = require('../src/config/catalogSeed.js');
const { readSheetRows } = require('../src/utils/simpleXlsx.js');
const { loadPricingTableOverrides } = require('../src/services/priceSheetService.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..', '..');
const productsDir = path.join(repoRoot, 'Assets', 'products');
const outputPath = process.argv[2] || path.join(productsDir, 'lbara-product-catalog.xlsx');
const legacyPath = path.join(productsDir, 'lbara-product-prices.xlsx');

const productHeaders = [
  'product_slug',
  'product_name',
  'provider',
  'category',
  'active',
  'photo_file',
  'photo_url',
  'photo_full_path',
  'photo_status',
  'fulfillment_type',
  'account_type',
  'duration_label',
  'delivery_hours',
  'product_description',
  'customer_requirements',
  'fulfillment_notes',
  'admin_notes',
];

const variationHeaders = [
  'product_slug',
  'product_name',
  'variant_slug',
  'variant_name',
  'billing_period',
  'checkout_mode',
  'price_tnd',
  'deposit_tnd',
  'variant_description',
  'sort_order',
  'active',
  'customer_requirements',
  'fulfillment_notes',
  'admin_notes',
];

const flowDetails = {
  gift_card: {
    requirement: 'Customer may choose code delivery, assisted redemption, or guided redemption where supported.',
    note: 'Gift-card/store-credit flow. Region, VPN, or Apple/Google account-country steps may apply.',
  },
  giftable_subscription: {
    requirement: 'Customer must provide a valid email already linked to the service account.',
    note: 'Giftable subscription flow. Use the service account email and confirm eligibility before activation.',
  },
  account_setup: {
    requirement: 'Customer chooses existing-account activation or new-account setup using an email they control.',
    note: 'Account setup flow. Never ask for more account access than needed for the selected service.',
  },
  existing_account_only: {
    requirement: 'Customer must provide the existing account/course details because the purchase must attach to that account.',
    note: 'Existing-account-only flow. Make the non-refundable request/deposit condition clear before checkout.',
  },
};

function encodeAsset(file) {
  return '/assets/products/' + encodeURIComponent(file || '');
}

function xml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colName(index) {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function numberLike(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  return value.trim() !== '' && /^-?\d+(\.\d+)?$/.test(value.trim());
}

function cell(rowNumber, colIndex, value, style = 2) {
  const ref = colName(colIndex) + rowNumber;
  if (value === null || value === undefined || value === '') return `<c r="${ref}" s="${style}"/>`;
  if (typeof value === 'boolean') return `<c r="${ref}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (numberLike(value)) return `<c r="${ref}" s="${style}"><v>${xml(value)}</v></c>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
}

function row(rowNumber, values, styleForColumn) {
  return `<row r="${rowNumber}" ht="34" customHeight="1">`
    + values.map((value, index) => cell(rowNumber, index, value, styleForColumn?.(index) ?? 2)).join('')
    + '</row>';
}

function columns(widths) {
  return '<cols>' + widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('') + '</cols>';
}

function worksheetXml(headers, rows, widths, frozenColumns = 0, priceColumns = []) {
  const lastRef = colName(headers.length - 1) + (rows.length + 1);
  const pane = frozenColumns > 0
    ? `<pane xSplit="${frozenColumns}" ySplit="1" topLeftCell="${colName(frozenColumns)}2" activePane="bottomRight" state="frozen"/><selection pane="bottomRight"/>`
    : '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>';
  const styleForColumn = (index) => priceColumns.includes(index) ? 3 : 2;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>
  ${columns(widths)}
  <sheetData>
    ${row(1, headers, () => 1)}
    ${rows.map((values, index) => row(index + 2, values, styleForColumn)).join('\n')}
  </sheetData>
  <autoFilter ref="A1:${lastRef}"/>
</worksheet>`;
}

function sheetNameFromPath(filePath) {
  return path.basename(filePath).replace(/\.[^.]+$/, '');
}

function rowsToObjects(rows) {
  const headers = (rows[0] || []).map((value) => String(value || '').trim().toLowerCase());
  return rows.slice(1).map((rowValues) => {
    const object = {};
    headers.forEach((header, index) => {
      if (header) object[header] = rowValues[index];
    });
    return object;
  });
}

function readExistingData() {
  const products = new Map();
  const variants = new Map();

  for (const source of [legacyPath, outputPath]) {
    if (!fs.existsSync(source)) continue;

    try {
      for (const rowObject of rowsToObjects(readSheetRows(source, 'Products'))) {
        if (!rowObject.product_slug) continue;
        const existing = products.get(rowObject.product_slug);
        if (!existing || String(rowObject.product_description || '').length >= String(existing.product_description || '').length) {
          products.set(rowObject.product_slug, { ...existing, ...rowObject });
        }
      }
    } catch {}

    for (const sheet of ['Variations', 'Prices']) {
      try {
        for (const rowObject of rowsToObjects(readSheetRows(source, sheet))) {
          if (rowObject.product_slug && rowObject.product_description) {
            const existing = products.get(rowObject.product_slug);
            if (!existing || String(rowObject.product_description || '').length > String(existing.product_description || '').length) {
              products.set(rowObject.product_slug, { ...existing, ...rowObject });
            }
          }
          if (rowObject.product_slug && rowObject.variant_slug) {
            const key = `${rowObject.product_slug}::${rowObject.variant_slug}`;
            const existing = variants.get(key);
            const merged = { ...existing, ...rowObject };
            if (existing && existing.price_tnd !== undefined && existing.price_tnd !== '') merged.price_tnd = existing.price_tnd;
            if (existing && existing.deposit_tnd !== undefined && existing.deposit_tnd !== '') merged.deposit_tnd = existing.deposit_tnd;
            if (existing && String(existing.variant_description || '').length > String(rowObject.variant_description || '').length) {
              merged.variant_description = existing.variant_description;
            }
            variants.set(key, merged);
          }
        }
        break;
      } catch {}
    }
  }

  return { products, variants };
}

function productRequirement(product) {
  return flowDetails[product.fulfillment_type]?.requirement || flowDetails.account_setup.requirement;
}

function productNote(product) {
  return flowDetails[product.fulfillment_type]?.note || flowDetails.account_setup.note;
}

function productDescription(product, existing) {
  return product.description || existing.product_description || `${product.name} service with selectable options.`;
}

function variantDescription(product, variant, existing) {
  if (variant.description) return variant.description;
  if (existing.variant_description) return existing.variant_description;
  if (variant.checkout_mode === 'quote') return `Special request ticket for ${product.name}. The 1.500 TND ticket opens a review and is not part of the final service price. It is not refundable if the customer changes their mind after review starts.`;
  if (/annual/i.test(`${variant.slug} ${variant.name}`) || /12\s*months?/i.test(variant.billing_period || '')) return `Annual ${product.name} option. You pay once for the full period, and the effective monthly cost is usually lower than renewing monthly.`;
  if (/^\$/.test(variant.name)) return `${variant.name} ${product.provider} credit delivered with redemption instructions.`;
  return `${variant.name} option for ${product.name}.`;
}

function activeValue(existing, fallback = true) {
  if (existing.active === undefined || existing.active === '') return fallback;
  const normalized = String(existing.active).trim().toLowerCase();
  return !['false', '0', 'no', 'inactive', 'off'].includes(normalized);
}

function buildRows() {
  const existing = readExistingData();
  const pricingTable = loadPricingTableOverrides();
  const productRows = [];
  const variationRows = [];
  let priceOverridesApplied = 0;

  for (const product of catalog) {
    const currentProduct = existing.products.get(product.slug) || {};
    const photoFile = currentProduct.photo_file || product.image || '';
    const photoFullPath = photoFile ? path.join(productsDir, photoFile) : '';
    const photoUrl = currentProduct.photo_url || encodeAsset(photoFile);
    const photoStatus = fs.existsSync(photoFullPath) ? 'Found' : 'Missing';
    const accountType = currentProduct.account_type || product.account_type || 'private';
    const durationLabel = currentProduct.duration_label || product.duration_label || 'Options';
    const deliveryHours = currentProduct.delivery_hours || product.delivery_hours || 2;

    productRows.push([
      product.slug,
      product.name || currentProduct.product_name,
      currentProduct.provider || product.provider,
      currentProduct.category || product.category,
      activeValue(currentProduct, true),
      photoFile,
      photoUrl,
      photoFullPath,
      photoStatus,
      currentProduct.fulfillment_type || product.fulfillment_type,
      accountType,
      durationLabel,
      deliveryHours,
      productDescription(product, currentProduct),
      currentProduct.customer_requirements || productRequirement(product),
      currentProduct.fulfillment_notes || productNote(product),
      currentProduct.admin_notes || '',
    ]);

    for (const variant of product.variants || []) {
      const key = `${product.slug}::${variant.slug}`;
      const currentVariant = existing.variants.get(key) || {};
      const checkoutMode = variant.checkout_mode || currentVariant.checkout_mode || 'full_payment';
      const pricingOverride = pricingTable.overrides.get(key);
      let priceTnd = variant.price_tnd ?? currentVariant.price_tnd ?? '';
      let depositTnd = variant.deposit_tnd ?? currentVariant.deposit_tnd ?? '';

      if (checkoutMode === 'full_payment' && pricingOverride) {
        priceTnd = pricingOverride.amount;
        depositTnd = '';
        priceOverridesApplied += 1;
      } else if (checkoutMode === 'quote') {
        priceTnd = '';
        depositTnd = variant.deposit_tnd ?? currentVariant.deposit_tnd ?? 1.5;
      }

      variationRows.push([
        product.slug,
        product.name || currentProduct.product_name,
        variant.slug,
        variant.name || currentVariant.variant_name,
        variant.billing_period || currentVariant.billing_period || '',
        checkoutMode,
        priceTnd,
        depositTnd,
        variantDescription(product, variant, currentVariant),
        variant.sort_order || currentVariant.sort_order || 100,
        activeValue(currentVariant, true),
        currentVariant.customer_requirements || productRequirement(product),
        currentVariant.fulfillment_notes || productNote(product),
        currentVariant.admin_notes || '',
      ]);
    }
  }

  return { productRows, variationRows, priceOverridesApplied };
}

function zipDateTime() {
  return { time: 0, date: 0 };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[i] = value >>> 0;
  }
  return table;
})();

function writeZip(filePath, entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const { time, date } = zipDateTime();

  for (const [name, content] of entries) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const compressed = zlib.deflateRawSync(data);
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(filePath, Buffer.concat([...locals, centralDirectory, end]));
}

function workbookEntries(productRows, variationRows) {
  const instructionRows = [
    ['Purpose', 'This workbook is the full product catalog source for Lbara.tn. Use Products for product-level details and Variations for every purchasable option.'],
    ['Prices', 'Only edit price_tnd or deposit_tnd when you are ready. Blank means Pricing TBD on the website.'],
    ['Photos', 'photo_file is the source image filename in Assets/products. photo_url is the website path used by the app.'],
    ['Stable IDs', 'Do not rename product_slug or variant_slug unless you also update the database/app references.'],
    ['Sync', 'After editing, run npm run prices:sync from Code/backend to update the local database.'],
  ];
  const listRows = [
    ['categories', 'fulfillment_types', 'checkout_modes', 'active_values'],
    ['streaming', 'gift_card', 'full_payment', 'TRUE'],
    ['ai_tools', 'giftable_subscription', 'quote', 'FALSE'],
    ['productivity', 'account_setup', '', ''],
    ['education', 'existing_account_only', '', ''],
    ['gaming', '', '', ''],
    ['gift_cards', '', '', ''],
    ['storage', '', '', ''],
    ['cloud', '', '', ''],
    ['vpn', '', '', ''],
    ['books', '', '', ''],
    ['social', '', '', ''],
    ['lifestyle', '', '', ''],
  ];

  const sheets = [
    ['Instructions', ['field', 'details'], instructionRows, [22, 130], 0, []],
    ['Products', productHeaders, productRows, [26, 28, 18, 16, 10, 32, 34, 68, 14, 22, 16, 16, 14, 72, 58, 58, 42], 2, []],
    ['Variations', variationHeaders, variationRows, [26, 28, 28, 28, 18, 18, 14, 14, 72, 12, 10, 58, 58, 42], 2, [6, 7]],
    ['Lists', listRows[0], listRows.slice(1), [22, 26, 20, 18], 0, []],
  ];

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map(([name], index) => `<sheet name="${xml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FF003060"/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF003060"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF3CD"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border/><border><left style="thin"><color rgb="FFE5E7EB"/></left><right style="thin"><color rgb="FFE5E7EB"/></right><top style="thin"><color rgb="FFE5E7EB"/></top><bottom style="thin"><color rgb="FFE5E7EB"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="2" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const entries = [
    ['[Content_Types].xml', contentTypes],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`],
    ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Lbara.tn Product Catalog</dc:title><dc:creator>Lbara.tn</dc:creator><cp:lastModifiedBy>Lbara.tn</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-05-01T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-01T00:00:00Z</dcterms:modified></cp:coreProperties>`],
    ['docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Lbara.tn</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map(([name]) => `<vt:lpstr>${xml(name)}</vt:lpstr>`).join('')}</vt:vector></TitlesOfParts></Properties>`],
    ['xl/workbook.xml', workbook],
    ['xl/_rels/workbook.xml.rels', workbookRels],
    ['xl/styles.xml', styles],
  ];

  sheets.forEach(([name, headers, rows, widths, frozenColumns, priceColumns], index) => {
    entries.push([`xl/worksheets/sheet${index + 1}.xml`, worksheetXml(headers, rows, widths, frozenColumns, priceColumns)]);
  });

  return entries;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const { productRows, variationRows, priceOverridesApplied } = buildRows();
const tempPath = path.join(path.dirname(outputPath), `${sheetNameFromPath(outputPath)}.tmp-${Date.now()}.xlsx`);
writeZip(tempPath, workbookEntries(productRows, variationRows));
if (fs.existsSync(outputPath)) fs.rmSync(outputPath, { force: true });
fs.renameSync(tempPath, outputPath);
if (path.resolve(outputPath) !== path.resolve(legacyPath)) fs.copyFileSync(outputPath, legacyPath);

console.log(JSON.stringify({
  outputPath,
  legacyPath,
  products: productRows.length,
  variations: variationRows.length,
  priceOverridesApplied,
  priceColumnsBlank: variationRows.every((row) => row[6] === '' && row[7] === ''),
}, null, 2));
