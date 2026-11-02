import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckResult } from '../types.js';

export function validateStructure(projectRoot: string): CheckResult {
  const required = [
    'ai-roster.config.ts',
    'package.json',
    'roster/agents',
    'roster/schemas',
    'runtime/db.ts',
    'runtime/session.ts',
    'runtime/task.ts',
    'runtime/pipeline.ts',
    'runtime/cli.ts',
    'adapters/reader.ts',
  ];

  const missing = required.filter((p) => !existsSync(join(projectRoot, p)));

  if (missing.length > 0) {
    return {
      name: 'structure',
      passed: false,
      message: `${missing.length} required files/directories missing`,
      details: missing,
    };
  }

  return {
    name: 'structure',
    passed: true,
    message: 'All required project files present',
  };
}
