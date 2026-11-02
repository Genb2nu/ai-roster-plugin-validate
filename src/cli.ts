#!/usr/bin/env node
import { resolve } from 'node:path';
import { validate } from './index.js';

const projectRoot = resolve(process.argv[2] ?? process.cwd());

console.log(`AI Roster Validation — ${projectRoot}\n`);

const report = await validate(projectRoot);

for (const check of report.checks) {
  const icon = check.passed ? 'PASS' : 'FAIL';
  console.log(`  ${icon}  ${check.name} — ${check.message}`);
  if (check.details) {
    for (const d of check.details) {
      console.log(`        ${d}`);
    }
  }
}

console.log(`\n${report.passed}/${report.total} passed, ${report.failed} failed.`);

if (report.failed > 0) {
  process.exit(1);
}
