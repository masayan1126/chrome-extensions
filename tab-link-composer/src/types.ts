export type TabGroupScope =
  | { kind: 'all' }
  | { kind: 'currentWindow' }
  | { kind: 'selectedTabs'; tabIds: number[] }
  | { kind: 'group'; groupId: number };

export type OutputFormat =
  | { kind: 'plain' }
  | { kind: 'markdown' }
  | { kind: 'html' }
  | { kind: 'title_newline_url' }
  | { kind: 'url_only' }
  | { kind: 'custom'; template: string };

export interface CopyRequest {
  scope: TabGroupScope;
  format: OutputFormat;
  decodeUrl: boolean;
  decodePunycode: boolean;
}

export interface TabInfo {
  id: number;
  title: string;
  url: string;
  groupId?: number;
}


