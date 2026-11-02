import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckResult } from '../types.js';

export function validatePipeline(projectRoot: string): CheckResult {
  const configPath = join(projectRoot, 'ai-roster.config.ts');

  if (!existsSync(configPath)) {
    return { name: 'pipeline', passed: false, message: 'ai-roster.config.ts not found' };
  }

  const content = readFileSync(configPath, 'utf-8');
  const issues: string[] = [];

  const stagesMatch = content.match(/pipelineStages:\s*\[([\s\S]*?)\]/);
  if (!stagesMatch) {
    issues.push('No pipelineStages array found in config');
  } else {
    const stages = stagesMatch[1].match(/'([^']+)'/g)?.map((s) => s.replace(/'/g, ''));
    if (!stages || stages.length < 2) {
      issues.push('Pipeline needs at least 2 stages');
    }
  }

  const gatesMatch = content.match(/gates:\s*\{([\s\S]*?)\n  \}/);
  if (!gatesMatch) {
    issues.push('No gates configuration found in pipeline config');
  } else {
    const evidenceCount = (gatesMatch[1].match(/requiredEvidence:/g) || []).length;
    if (evidenceCount === 0) {
      issues.push('No gates have requiredEvidence defined');
    }
  }

  const templatePath = join(projectRoot, 'roster/templates/response.md');
  if (!existsSync(templatePath)) {
    issues.push('Response template not found: roster/templates/response.md');
  }

  const handoffPath = join(projectRoot, 'roster/templates/handoff.md');
  if (!existsSync(handoffPath)) {
    issues.push('Handoff template not found: roster/templates/handoff.md');
  }

  if (issues.length > 0) {
    return {
      name: 'pipeline',
      passed: false,
      message: `${issues.length} pipeline configuration issue(s)`,
      details: issues,
    };
  }

  return {
    name: 'pipeline',
    passed: true,
    message: 'Pipeline stages, gates, and templates configured',
  };
}
