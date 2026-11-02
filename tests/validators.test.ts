import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateStructure } from '../src/validators/structure.js';
import { validateSchemas } from '../src/validators/schemas.js';
import { validateAgents } from '../src/validators/agents.js';
import { validatePipeline } from '../src/validators/pipeline.js';
import { validateRuntime } from '../src/validators/runtime.js';
import { validate } from '../src/index.js';

describe('Validators', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ar-validate-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('structure', () => {
    it('fails when project files are missing', () => {
      const result = validateStructure(tmpDir);
      expect(result.passed).toBe(false);
      expect(result.details).toContain('ai-roster.config.ts');
    });

    it('passes when all required files exist', () => {
      const dirs = [
        'roster/agents', 'roster/schemas',
        'runtime', 'adapters',
      ];
      for (const d of dirs) mkdirSync(join(tmpDir, d), { recursive: true });

      writeFileSync(join(tmpDir, 'ai-roster.config.ts'), 'export default {}');
      writeFileSync(join(tmpDir, 'package.json'), '{}');
      writeFileSync(join(tmpDir, 'runtime/db.ts'), '');
      writeFileSync(join(tmpDir, 'runtime/session.ts'), '');
      writeFileSync(join(tmpDir, 'runtime/task.ts'), '');
      writeFileSync(join(tmpDir, 'runtime/pipeline.ts'), '');
      writeFileSync(join(tmpDir, 'runtime/cli.ts'), '');
      writeFileSync(join(tmpDir, 'adapters/reader.ts'), '');

      const result = validateStructure(tmpDir);
      expect(result.passed).toBe(true);
    });
  });

  describe('schemas', () => {
    it('fails when schemas dir is missing', () => {
      const result = validateSchemas(tmpDir);
      expect(result.passed).toBe(false);
    });

    it('passes with valid schema files', () => {
      const schemasDir = join(tmpDir, 'roster/schemas');
      mkdirSync(schemasDir, { recursive: true });

      writeFileSync(join(schemasDir, 'test.schema.json'), JSON.stringify({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        type: 'object',
        properties: { name: { type: 'string' } },
      }));

      const result = validateSchemas(tmpDir);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('1 schemas valid');
    });

    it('fails with invalid schema', () => {
      const schemasDir = join(tmpDir, 'roster/schemas');
      mkdirSync(schemasDir, { recursive: true });
      writeFileSync(join(schemasDir, 'bad.schema.json'), 'not json');

      const result = validateSchemas(tmpDir);
      expect(result.passed).toBe(false);
    });
  });

  describe('agents', () => {
    it('fails when agents dir is missing', () => {
      const result = validateAgents(tmpDir);
      expect(result.passed).toBe(false);
    });

    it('passes with valid agent definitions', () => {
      const agentsDir = join(tmpDir, 'roster/agents');
      const schemasDir = join(tmpDir, 'roster/schemas');
      mkdirSync(agentsDir, { recursive: true });
      mkdirSync(schemasDir, { recursive: true });

      writeFileSync(join(schemasDir, 'agent.schema.json'), JSON.stringify({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      }));

      writeFileSync(join(agentsDir, 'test-agent.md'), [
        '---',
        'id: test-agent',
        'name: Test Agent',
        '---',
        '',
        '## Mission',
        'A test agent.',
      ].join('\n'));

      const result = validateAgents(tmpDir);
      expect(result.passed).toBe(true);
    });

    it('fails with invalid frontmatter', () => {
      const agentsDir = join(tmpDir, 'roster/agents');
      const schemasDir = join(tmpDir, 'roster/schemas');
      mkdirSync(agentsDir, { recursive: true });
      mkdirSync(schemasDir, { recursive: true });

      writeFileSync(join(schemasDir, 'agent.schema.json'), JSON.stringify({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      }));

      writeFileSync(join(agentsDir, 'bad.md'), '---\nid: bad\n---\n\nMissing name.');

      const result = validateAgents(tmpDir);
      expect(result.passed).toBe(false);
    });
  });

  describe('pipeline', () => {
    it('fails when config is missing', () => {
      const result = validatePipeline(tmpDir);
      expect(result.passed).toBe(false);
    });
  });

  describe('runtime', () => {
    it('passes when no database exists', async () => {
      const result = await validateRuntime(tmpDir);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('not initialized');
    });
  });

  describe('full validation', () => {
    it('runs against AI Roster project and passes', async () => {
      const rosterRoot = join(import.meta.dirname, '..', '..', 'AI Roster');
      const report = await validate(rosterRoot);

      expect(report.total).toBe(6);
      expect(report.failed).toBe(0);
      expect(report.passed).toBe(6);
    });
  });
});
