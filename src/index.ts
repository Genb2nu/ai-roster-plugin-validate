import type { ValidationReport, CheckResult } from './types.js';
import { validateStructure } from './validators/structure.js';
import { validateSchemas } from './validators/schemas.js';
import { validateAgents } from './validators/agents.js';
import { validateAdapters } from './validators/adapters.js';
import { validateRuntime } from './validators/runtime.js';
import { validatePipeline } from './validators/pipeline.js';

export type { ValidationReport, CheckResult };

export async function validate(projectRoot: string): Promise<ValidationReport> {
  const checks: CheckResult[] = [];

  checks.push(validateStructure(projectRoot));
  checks.push(validateSchemas(projectRoot));
  checks.push(validateAgents(projectRoot));
  checks.push(validatePipeline(projectRoot));
  checks.push(await validateRuntime(projectRoot));
  checks.push(validateAdapters(projectRoot));

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;

  return {
    projectRoot,
    timestamp: new Date().toISOString(),
    checks,
    passed,
    failed,
    total: checks.length,
  };
}
