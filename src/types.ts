import type { JSONValue } from '@devvit/public-api';

export type ClaimStatus = 'claimed' | 'investigating';

// All state types must satisfy JSONValue (Devvit useState constraint)
export interface ClaimData {
  [key: string]: JSONValue;
  modId: string;
  modUsername: string;
  status: ClaimStatus;
  claimedAt: number;
  itemId: string;
  isPost: boolean;
  originalFlairText: string | null;
  originalFlairCssClass: string | null;
}

export interface ActiveMod {
  [key: string]: JSONValue;
  modId: string;
  username: string;
  lastSeen: number;
}

export interface ActivityEntry {
  [key: string]: JSONValue;
  type: 'CLAIM' | 'RELEASE' | 'ACTION' | 'REPORT';
  modUsername: string;
  itemId: string;
  action: string | null;
  status: ClaimStatus | null;
  timestamp: number;
}

// Flat interface (not union) so it satisfies JSONValue for useChannel<T>
export interface SyncMessage {
  [key: string]: JSONValue;
  type: 'CLAIM' | 'RELEASE' | 'ACTION';
  itemId: string;
  modUsername: string;
  status: ClaimStatus | null;
  claimedAt: number | null;
  action: string | null;
}
