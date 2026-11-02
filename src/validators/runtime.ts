import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckResult } from '../types.js';

export async function validateRuntime(projectRoot: string): Promise<CheckResult> {
  const dbPath = join(projectRoot, '.ai-roster/runtime.db');

  if (!existsSync(dbPath)) {
    return {
      name: 'runtime',
      passed: true,
      message: 'No runtime database (not initialized yet — this is normal for a fresh project)',
    };
  }

  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(dbPath);

    try {
      const version = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get() as { version: number } | undefined;
      if (!version) {
        return { name: 'runtime', passed: false, message: 'schema_version table is empty' };
      }

      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      ).all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);

      const required = ['sessions', 'tasks', 'events', 'schema_version'];
      const missing = required.filter((t) => !tableNames.includes(t));

      if (missing.length > 0) {
        return {
          name: 'runtime',
          passed: false,
          message: 'Required tables missing from runtime database',
          details: missing,
        };
      }

      const activeSessions = db.prepare(
        "SELECT COUNT(*) as count FROM sessions WHERE status = 'active'",
      ).get() as { count: number };

      const inProgress = db.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'In Progress'",
      ).get() as { count: number };

      return {
        name: 'runtime',
        passed: true,
        message: `Database healthy (schema v${version.version}, ${activeSessions.count} active sessions, ${inProgress.count} tasks in progress)`,
      };
    } finally {
      db.close();
    }
  } catch (err) {
    return {
      name: 'runtime',
      passed: false,
      message: `Database check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
