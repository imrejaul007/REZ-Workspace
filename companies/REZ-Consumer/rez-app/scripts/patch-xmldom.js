import logger from './utils/logger';

const fs = require('fs');
const path = require('path');

const xmldomPath = path.join(__dirname, '..', 'node_modules', '@xmldom', 'xmldom', 'lib', 'sax.js');
const parsePath = path.join(__dirname, '..', 'node_modules', '@expo', 'plist', 'build', 'parse.js');

logger.info('Patching xmldom...');

// Patch sax.js to allow XML declarations
if (fs.existsSync(xmldomPath)) {
  let saxContent = fs.readFileSync(xmldomPath, 'utf8');
  if (saxContent.includes('processing instruction at position 1')) {
    saxContent = saxContent.replace(
      /fatalError\("processing instruction at position 1 is an xml declaration which is only at the start of the document"\)/g,
      '// Allow XML declaration at start - xmldom bug workaround'
    );
    fs.writeFileSync(xmldomPath, saxContent);
    logger.info('Patched sax.js');
  }
}

// Patch parse.js to add mimeType
if (fs.existsSync(parsePath)) {
  let parseContent = fs.readFileSync(parsePath, 'utf8');
  if (parseContent.includes('parseFromString(xml)')) {
    parseContent = parseContent.replace(
      /parseFromString\(xml\)/g,
      'parseFromString(xml, "text/xml")'
    );
    fs.writeFileSync(parsePath, parseContent);
    logger.info('Patched parse.js');
  }
}

logger.info('Done patching xmldom');
