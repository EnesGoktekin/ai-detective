// Database related types

export interface DatabaseConfig {
  url: string;
  key: string;
}

export interface DatabaseInfo {
  url: string;
  connected: boolean;
}

export interface DatabaseTestResult {
  status: 'connected' | 'disconnected' | 'error';
  database: DatabaseInfo;
  message: string;
  timestamp: string;
  error?: string;
}
