export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

export interface ValidationReport {
  projectRoot: string;
  timestamp: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
  total: number;
}
