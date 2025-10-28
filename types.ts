export enum DetectionStatus {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  ANALYZING = 'ANALYZING',
  DANGER = 'DANGER',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error';
}

export interface TestResult {
  name: string;
  expected: 'DANGER' | 'SAFE';
  actual: 'DANGER' | 'SAFE';
  description: string | null;
  passed: boolean;
}
