import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';
import type { CheckResult } from '../types.js';

export function validateAgents(projectRoot: string): CheckResult {
  const agentsDir = join(projectRoot, 'roster/agents');
  const schemaPath = join(projectRoot, 'roster/schemas/agent.schema.json');

  if (!existsSync(agentsDir)) {
    return { name: 'agents', passed: false, message: 'roster/agents/ directory not found' };
  }

  if (!existsSync(schemaPath)) {
    return { name: 'agents', passed: false, message: 'roster/schemas/agent.schema.json not found' };
  }

  const agentFiles = readdirSync(agentsDir).filter(
    (f) => f.endsWith('.md') && f !== 'README.md' && f !== 'agent.md',
  );

  if (agentFiles.length === 0) {
    return { name: 'agents', passed: false, message: 'No agent definitions found in roster/agents/' };
  }

  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false, logger: false });
  const validate = ajv.compile(schema);

  const failures: string[] = [];

  for (const file of agentFiles) {
    const content = readFileSync(join(agentsDir, file), 'utf-8');
    const normalized = content.replace(/\r\n/g, '\n');
    const fmMatch = normalized.match(/^---\n([\s\S]*?)\n---/);

    if (!fmMatch) {
      failures.push(`${file}: no YAML frontmatter found`);
      continue;
    }

    const frontmatter = parseYaml(fmMatch[1]) as Record<string, unknown>;
    const valid = validate(frontmatter);

    if (!valid) {
      const errors = (validate.errors ?? [])
        .map((e) => `${e.instancePath || '/'} ${e.message}`)
        .join('; ');
      failures.push(`${file}: ${errors}`);
    }
  }

  if (failures.length > 0) {
    return {
      name: 'agents',
      passed: false,
      message: `${failures.length}/${agentFiles.length} agent definitions failed`,
      details: failures,
    };
  }

  return {
    name: 'agents',
    passed: true,
    message: `${agentFiles.length} agent definitions valid`,
  };
}
