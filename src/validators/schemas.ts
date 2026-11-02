import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import type { CheckResult } from '../types.js';

export function validateSchemas(projectRoot: string): CheckResult {
  const schemasDir = join(projectRoot, 'roster/schemas');

  if (!existsSync(schemasDir)) {
    return { name: 'schemas', passed: false, message: 'roster/schemas/ directory not found' };
  }

  const schemaFiles = readdirSync(schemasDir).filter((f) => f.endsWith('.schema.json'));

  if (schemaFiles.length === 0) {
    return { name: 'schemas', passed: false, message: 'No schema files found in roster/schemas/' };
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false, logger: false });
  const failures: string[] = [];

  for (const file of schemaFiles) {
    try {
      const schema = JSON.parse(readFileSync(join(schemasDir, file), 'utf-8'));
      ajv.compile(schema);
    } catch (err) {
      failures.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (failures.length > 0) {
    return {
      name: 'schemas',
      passed: false,
      message: `${failures.length}/${schemaFiles.length} schemas failed validation`,
      details: failures,
    };
  }

  return {
    name: 'schemas',
    passed: true,
    message: `${schemaFiles.length} schemas valid`,
  };
}
