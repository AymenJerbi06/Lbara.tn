const fs = require('fs');
const zlib = require('zlib');

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseAttrs(xml) {
  const attrs = {};
  for (const match of xml.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function findEndOfCentralDirectory(buffer) {
  const min = Math.max(0, buffer.length - 0xffff - 22);
  for (let i = buffer.length - 22; i >= min; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('Invalid XLSX file: central directory not found.');
}

function readZipEntries(filePath) {
  const buffer = fs.readFileSync(filePath);
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Invalid XLSX file: central directory entry is corrupt.');
    }

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + fileNameLength).replace(/\\/g, '/');

    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Invalid XLSX file: local header is corrupt for ${name}.`);
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data;

    if (method === 0) data = compressed;
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else throw new Error(`Unsupported XLSX compression method ${method} for ${name}.`);

    entries.set(name, data.toString('utf8'));
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readSharedStrings(entries) {
  const xml = entries.get('xl/sharedStrings.xml');
  if (!xml) return [];

  return Array.from(xml.matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)).map((match) => {
    return Array.from(match[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g))
      .map((text) => decodeXml(text[1]))
      .join('');
  });
}

function columnIndex(cellRef) {
  const letters = String(cellRef || '').match(/[A-Z]+/i)?.[0] || 'A';
  let index = 0;
  for (const char of letters.toUpperCase()) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}

function getSheetPath(entries, sheetName) {
  const workbookXml = entries.get('xl/workbook.xml');
  const relsXml = entries.get('xl/_rels/workbook.xml.rels');
  if (!workbookXml || !relsXml) throw new Error('Invalid XLSX file: workbook metadata is missing.');

  let relId = null;
  for (const match of workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?>/g)) {
    const attrs = parseAttrs(match[1]);
    if (attrs.name === sheetName) {
      relId = attrs['r:id'];
      break;
    }
  }

  if (!relId) throw new Error(`Sheet "${sheetName}" was not found in the workbook.`);

  for (const match of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attrs = parseAttrs(match[1]);
    if (attrs.Id === relId) {
      const target = attrs.Target.replace(/^\/+/, '');
      return target.startsWith('xl/') ? target : `xl/${target}`;
    }
  }

  throw new Error(`Sheet relationship "${relId}" was not found.`);
}

function parseCellValue(cellXml, attrs, sharedStrings) {
  if (attrs.t === 'inlineStr') {
    const inline = Array.from(cellXml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g))
      .map((match) => decodeXml(match[1]))
      .join('');
    return inline;
  }

  const valueMatch = cellXml.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/);
  if (!valueMatch) return '';
  const raw = decodeXml(valueMatch[1]);

  if (attrs.t === 's') return sharedStrings[Number(raw)] || '';
  if (attrs.t === 'b') return raw === '1';
  if (attrs.t === 'str') return raw;

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
}

function readSheetRows(filePath, sheetName) {
  const entries = readZipEntries(filePath);
  const sharedStrings = readSharedStrings(entries);
  const sheetPath = getSheetPath(entries, sheetName);
  const sheetXml = entries.get(sheetPath);
  if (!sheetXml) throw new Error(`Sheet XML "${sheetPath}" was not found.`);

  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<(?:\w+:)?row\b[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const attrs = parseAttrs(cellMatch[1]);
      cells[columnIndex(attrs.r)] = parseCellValue(cellMatch[2] || '', attrs, sharedStrings);
    }
    rows.push(cells.map((value) => (value === undefined ? '' : value)));
  }

  return rows;
}

module.exports = { readSheetRows };
