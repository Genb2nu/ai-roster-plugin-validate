import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { CheckResult } from '../types.js';

export function validateAdapters(projectRoot: string): CheckResult {
  const claudeDir = join(projectRoot, '.claude/agents');
  const copilotPath = join(projectRoot, '.github/copilot/agents.json');

  const missing: string[] = [];
  if (!existsSync(claudeDir)) missing.push('.claude/agents/');
  if (!existsSync(copilotPath)) missing.push('.github/copilot/agents.json');

  if (missing.length > 0) {
    return {
      name: 'adapters',
      passed: false,
      message: 'Generated adapter files missing',
      details: missing.map((p) => `Not found: ${p}`),
    };
  }

  try {
    execFileSync(
      process.execPath,
      ['--import', 'tsx/esm', join(projectRoot, 'scripts/generate-adapters.ts')],
      { cwd: projectRoot, stdio: 'pipe' },
    );

    const diff = execFileSync(
      'git',
      ['diff', '--name-only', '--', claudeDir, join(projectRoot, '.github/copilot')],
      { cwd: projectRoot, encoding: 'utf-8' },
    ).trim();

    if (diff) {
      return {
        name: 'adapters',
        passed: false,
        message: 'Adapter drift detected — generated files differ from committed versions',
        details: diff.split('\n'),
      };
    }

    return {
      name: 'adapters',
      passed: true,
      message: 'Adapter files in sync with canonical definitions',
    };
  } catch (err) {
    return {
      name: 'adapters',
      passed: false,
      message: `Adapter generation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
