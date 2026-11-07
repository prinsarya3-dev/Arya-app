import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { 
  type ChatMessage, 
  type ChatConfig, 
  type AppUser, 
  OperationType 
} from '../types';
import { APP_CONFIG } from '../config/appConfig';

const CONFIG_DOC_PATH = 'chat_config/dyad';
const MESSAGES_COLLECTION = 'messages';
const USERS_COLLECTION = 'users';

/**
 * Generate a random 6-character invite code (alphanumeric, clear uppercase)
 */
export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Subscribes to the single system two-user configuration document
 */
export function subscribeToChatConfig(
  onUpdate: (config: ChatConfig | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const configDocRef = doc(db, 'chat_config', 'dyad');
  return onSnapshot(
    configDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as ChatConfig);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Error fetching chat configuration:', error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, CONFIG_DOC_PATH);
        } catch (wrapped) {
          onError(wrapped as Error);
        }
      }
    }
  );
}

/**
 * Bootstraps the Dyad configuration on first launch by User 1 (Admin/Creator)
 */
export async function initializeChatConfig(user: AppUser, initialUser2Email?: string): Promise<ChatConfig> {
  const configDocRef = doc(db, 'chat_config', 'dyad');
  const inviteCode = generateInviteCode();
  
  const initialConfig = {
    user1Uid: user.uid,
    user1Email: user.email || APP_CONFIG.defaultUser1Email,
    user2Uid: '',
    user2Email: initialUser2Email || APP_CONFIG.defaultUser2Email || '',
    inviteCode,
    appName: APP_CONFIG.appName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(configDocRef, initialConfig);
    return {
      ...initialConfig,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as unknown as ChatConfig;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONFIG_DOC_PATH);
  }
}

/**
 * Updates the pairing configuration (e.g. change invite code or assign user 2 email)
 */
export async function updateChatConfig(
  updates: Partial<Pick<ChatConfig, 'user1Uid' | 'user1Email' | 'user2Email' | 'inviteCode' | 'appName' | 'user2Uid'>>
): Promise<void> {
  const configDocRef = doc(db, 'chat_config', 'dyad');
  try {
    await updateDoc(configDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CONFIG_DOC_PATH);
  }
}

/**
 * Allows the primary owner/admin to claim or link User 1 slot
 */
export async function claimPrimaryUserSlot(user: AppUser): Promise<boolean> {
  const configDocRef = doc(db, 'chat_config', 'dyad');
  try {
    const snap = await getDoc(configDocRef);
    if (!snap.exists()) {
      await initializeChatConfig(user);
      return true;
    }
    await updateDoc(configDocRef, {
      user1Uid: user.uid,
      user1Email: user.email || APP_CONFIG.defaultUser1Email,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error claiming primary slot:', error);
    return false;
  }
}

/**
 * Allows User 2 to claim the second authorized slot via invite code or email match
 */
export async function claimSecondUserSlot(user: AppUser, enteredCode?: string): Promise<boolean> {
  const configDocRef = doc(db, 'chat_config', 'dyad');
  try {
    const snap = await getDoc(configDocRef);
    if (!snap.exists()) {
      return false;
    }
    const data = snap.data() as ChatConfig;

    // If slot 2 is already claimed by another UID
    if (data.user2Uid && data.user2Uid !== user.uid) {
      return false;
    }

    const matchesEmail = Boolean(data.user2Email && user.email && data.user2Email.toLowerCase() === user.email.toLowerCase());
    const matchesCode = Boolean(enteredCode && data.inviteCode && enteredCode.trim().toUpperCase() === data.inviteCode.toUpperCase());

    if (matchesEmail || matchesCode) {
      await updateDoc(configDocRef, {
        user2Uid: user.uid,
        user2Email: user.email || data.user2Email || '',
        updatedAt: serverTimestamp(),
      });
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CONFIG_DOC_PATH);
  }
}

/**
 * Updates User presence and typing status
 */
export async function updateUserPresence(
  user: AppUser, 
  isTyping: boolean = false, 
  slot?: 'user1' | 'user2'
): Promise<void> {
  if (!user.uid) return;
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  try {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || (slot === 'user1' ? 'User 1' : 'User 2'),
      lastSeen: serverTimestamp(),
      isTyping,
      slot: slot || 'user1',
      photoURL: user.photoURL || '',
    }, { merge: true });
  } catch (error) {
    console.warn('Presence update error:', error);
  }
}

/**
 * Subscribes to the other participant's live profile & typing status
 */
export function subscribeToPartnerProfile(
  partnerUid: string,
  onUpdate: (partner: AppUser | null) => void
): Unsubscribe {
  if (!partnerUid) {
    onUpdate(null);
    return () => {};
  }
  const partnerDocRef = doc(db, USERS_COLLECTION, partnerUid);
  return onSnapshot(
    partnerDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AppUser);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Partner profile subscription error:', err);
    }
  );
}

/**
 * Send a new private message with strict 5-day expiration
 */
export async function sendChatMessage(
  sender: AppUser,
  partnerUid: string,
  text: string
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const newMsgRef = doc(messagesRef);

  // Expiration calculation: strictly 5 days from now
  const nowMs = Date.now();
  const expireAtTimestamp = Timestamp.fromMillis(nowMs + APP_CONFIG.messageExpiryMs);

  const payload = {
    senderUid: sender.uid,
    senderEmail: sender.email || '',
    senderName: sender.displayName || 'Anonymous',
    text: cleanText.slice(0, 2000), // Enforce 2000 char limit
    createdAt: serverTimestamp(),
    expireAt: expireAtTimestamp,
    readBy: [sender.uid],
    participants: [sender.uid, partnerUid].filter(Boolean),
    delivered: true,
  };

  try {
    await setDoc(newMsgRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MESSAGES_COLLECTION}/${newMsgRef.id}`);
  }
}

/**
 * Subscribes to real-time messages and filters out expired messages
 */
export function subscribeToMessages(
  currentUid: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!currentUid) {
    onMessages([]);
    return () => {};
  }

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  // Filter messages where current user is a participant to comply with security rules
  const q = query(
    messagesRef,
    where('participants', 'array-contains', currentUid),
    limit(250)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now();
      const validMessages: ChatMessage[] = [];
      const expiredToClean: string[] = [];

      snapshot.docs.forEach((d) => {
        const data = d.data() as Omit<ChatMessage, 'id'>;
        const msg: ChatMessage = {
          ...data,
          id: d.id,
        };

        // Check if message is expired (5 days passed)
        const expireMs = msg.expireAt ? msg.expireAt.toMillis() : 0;
        if (expireMs > 0 && expireMs <= now) {
          expiredToClean.push(msg.id);
        } else {
          validMessages.push(msg);
        }
      });

      // Sort ascending by createdAt in memory (avoids requiring manual composite index on Spark free plan)
      validMessages.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return aTime - bTime;
      });

      // Pass active messages to component
      onMessages(validMessages);

      // Free Spark Plan active client cleanup:
      // Permanently delete expired messages from Firestore so they consume zero storage
      if (expiredToClean.length > 0) {
        expiredToClean.forEach(async (expiredId) => {
          try {
            await deleteDoc(doc(db, MESSAGES_COLLECTION, expiredId));
          } catch {
            // Will succeed if user is participant or already deleted
          }
        });
      }
    },
    (error) => {
      console.error('Error fetching chat messages:', error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.LIST, MESSAGES_COLLECTION);
        } catch (wrapped) {
          onError(wrapped as Error);
        }
      }
    }
  );
}

/**
 * Marks a message as read by the recipient
 */
export async function markMessageRead(messageId: string, currentUid: string, currentReadBy: string[]): Promise<void> {
  if (currentReadBy.includes(currentUid)) return;
  const msgDocRef = doc(db, MESSAGES_COLLECTION, messageId);
  try {
    await updateDoc(msgDocRef, {
      readBy: Array.from(new Set([...currentReadBy, currentUid])),
    });
  } catch (error) {
    // Non-blocking read receipt update
    console.warn('Could not update read receipt:', error);
  }
}

/**
 * Adds or updates an emoji reaction on a message
 */
export async function toggleMessageReaction(
  messageId: string, 
  reaction: string, 
  currentReaction?: string
): Promise<void> {
  const msgDocRef = doc(db, MESSAGES_COLLECTION, messageId);
  const newReaction = currentReaction === reaction ? '' : reaction;
  try {
    await updateDoc(msgDocRef, {
      reaction: newReaction,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MESSAGES_COLLECTION}/${messageId}`);
  }
}

/**
 * Permanently delete a single message manually
 */
export async function deleteSingleMessage(messageId: string): Promise<void> {
  const msgDocRef = doc(db, MESSAGES_COLLECTION, messageId);
  try {
    await deleteDoc(msgDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MESSAGES_COLLECTION}/${messageId}`);
  }
}
