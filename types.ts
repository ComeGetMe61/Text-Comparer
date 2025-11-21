
export enum DiffType {
  EQUAL = 'EQUAL',
  INSERT = 'INSERT',
  DELETE = 'DELETE',
  EMPTY = 'EMPTY' // For padding in side-by-side view
}

export interface DiffPart {
  type: DiffType;
  content: string;
}

export interface DiffLine {
  type: DiffType;
  content: string;
  originalLineNumber?: number;
  modifiedLineNumber?: number;
  parts?: DiffPart[];
}

export interface DiffResult {
  originalLines: DiffLine[];
  modifiedLines: DiffLine[];
  additions: number;
  deletions: number;
}

export type SupportedLanguage = 'plaintext' | 'javascript' | 'typescript' | 'json' | 'css' | 'html' | 'python' | 'sql';

export interface LanguageOption {
  label: string;
  value: SupportedLanguage;
}
