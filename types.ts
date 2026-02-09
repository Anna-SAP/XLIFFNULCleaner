export enum FileStatus {
  PENDING = 'PENDING',
  CLEAN = 'CLEAN', // No NUL characters found, valid XML
  FIXED = 'FIXED', // NUL characters removed, valid XML
  ERROR = 'ERROR', // Invalid XML even after cleaning, or read error
}

export interface ChangeRecord {
  lineNumber: number;
  originalContent: string;
  cleanedContent: string;
  nulCount: number;
}

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  content: string;
  nulCount: number;
  status: FileStatus;
  errorMessage?: string;
  timestamp: number;
  changes: ChangeRecord[];
}

export interface FileStats {
  total: number;
  fixed: number;
  clean: number;
  error: number;
  totalNulRemoved: number;
}