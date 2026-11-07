import { Timestamp } from 'firebase/firestore';

export type UserSlot = 'user1' | 'user2' | 'unauthorized';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  slot?: UserSlot;
  isTyping?: boolean;
  lastSeen?: Timestamp | Date | number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
  expireAt: Timestamp;
  readBy: string[];
  participants: string[];
  reaction?: string;
  delivered?: boolean;
}

export interface ChatConfig {
  user1Uid: string;
  user1Email: string;
  user2Uid?: string;
  user2Email?: string;
  inviteCode?: string;
  appName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
