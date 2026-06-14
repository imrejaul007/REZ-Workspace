import logger from './utils/logger';

#!/usr/bin/env npx ts-node
/**
 * Validate all JSON schemas against their TypeScript types.
 */

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');

async function validate(): Promise<void> {
  const ajv = new Ajv({ strict: true, allErrors: true });
  const schemaFiles = fs.readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.json'));

  let passed = 0;
  let failed = 0;

  for (const file of schemaFiles) {
    const filePath = path.join(SCHEMAS_DIR, file);
    const schema = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    try {
      ajv.compile(schema);
      logger.info(`✓ ${file}`);
      passed++;
    } catch (e) {
      logger.info(`✗ ${file}: ${e}`);
      failed++;
    }
  }

  logger.info(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

validate();
