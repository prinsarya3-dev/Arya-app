/**
 * Dyad - Private Two-User Messenger
 * 
 * Strict two-person end-to-end communication with 5-day ephemeral auto-deletion.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  testConnection 
} from './services/firebase';
import { 
  subscribeToChatConfig, 
  initializeChatConfig, 
  updateChatConfig,
  subscribeToMessages, 
  sendChatMessage, 
  markMessageRead, 
  toggleMessageReaction, 
  deleteSingleMessage, 
  updateUserPresence, 
  subscribeToPartnerProfile 
} from './services/chatService';
import { sound } from './services/sound';
import { APP_CONFIG } from './config/appConfig';
import { type AppUser, type ChatMessage, type ChatConfig } from './types';

// Components
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { AuthScreen } from './components/AuthScreen';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { SettingsModal } from './components/SettingsModal';
import { ExpiryInfoModal } from './components/ExpiryInfoModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { 
  Shield, 
  Lock, 
  Flame, 
  Sparkles, 
  Users, 
  Loader2 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [partnerUser, setPartnerUser] = useState<AppUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appName, setAppName] = useState<string>(() => {
    return localStorage.getItem('dyad_app_name') || APP_CONFIG.appName;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);
  const [showSettings, setShowSettings] = useState(false);
  const [showExpiryInfo, setShowExpiryInfo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // 1. Initial boot: Test Firestore connection per skill requirement
  useEffect(() => {
    testConnection();
  }, []);

  // 2. Firebase Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Subscribe to System Two-User Configuration
  useEffect(() => {
    const unsub = subscribeToChatConfig((newConfig) => {
      setConfig(newConfig);
      setConfigLoaded(true);
      if (newConfig?.appName) {
        setAppName(newConfig.appName);
      }
    });

    return () => unsub();
  }, []);

  // 4. Auto-initialize pairing config if database is brand new and current user is Admin (User 1)
  useEffect(() => {
    if (!currentUser || !configLoaded || authLoading) return;

    if (config === null) {
      // First user to boot application registers as User 1
      initializeChatConfig(currentUser)
        .then((created) => {
          if (created) setConfig(created);
        })
        .catch((err) => {
          console.warn('Config bootstrap check:', err);
        });
    }
  }, [currentUser, config, configLoaded, authLoading]);

  // Determine user authorization slot: 'user1' | 'user2' | 'unauthorized'
  const userSlot = useMemo(() => {
    if (!currentUser || !configLoaded) return null;
    if (!config) return null;

    const email = currentUser.email ? currentUser.email.toLowerCase() : '';
    const isOwnerEmail = Boolean(
      email && (
        email === config.user1Email.toLowerCase() ||
        APP_CONFIG.authorizedOwnerEmails.map((e) => e.toLowerCase()).includes(email)
      )
    );

    if (config.user1Uid === currentUser.uid || isOwnerEmail) {
      return 'user1';
    }

    if (
      config.user2Uid === currentUser.uid ||
      (email && config.user2Email && config.user2Email.toLowerCase() === email)
    ) {
      return 'user2';
    }

    return 'unauthorized';
  }, [currentUser, config, configLoaded]);

  // If current user is recognized as User 1 by email but UID isn't synced yet, sync UID
  useEffect(() => {
    if (!currentUser || !config || userSlot !== 'user1') return;
    if (config.user1Uid !== currentUser.uid) {
      updateChatConfig({ user1Uid: currentUser.uid, user1Email: currentUser.email || config.user1Email }).catch(() => {});
    }
  }, [currentUser, config, userSlot]);

  const partnerUid = useMemo(() => {
    if (!config || !userSlot) return '';
    return userSlot === 'user1' ? (config.user2Uid || '') : config.user1Uid;
  }, [config, userSlot]);

  // 5. Update user presence & listen for partner
  useEffect(() => {
    if (!currentUser || !userSlot || userSlot === 'unauthorized') return;

    // Update initial presence
    updateUserPresence(currentUser, false, userSlot);

    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      updateUserPresence(currentUser, false, userSlot);
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresence(currentUser, false, userSlot);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, userSlot]);

  // 6. Subscribe to Partner's live profile
  useEffect(() => {
    if (!partnerUid) {
      setPartnerUser(null);
      return;
    }
    const unsub = subscribeToPartnerProfile(partnerUid, setPartnerUser);
    return () => unsub();
  }, [partnerUid]);

  // 7. Subscribe to real-time messages (ONLY when authorized as user1 or user2)
  useEffect(() => {
    if (!currentUser || (userSlot !== 'user1' && userSlot !== 'user2')) return;

    const unsub = subscribeToMessages(
      currentUser.uid,
      (newMessages) => {
        // Check for new incoming message to play receive chime
        if (newMessages.length > prevMessagesCountRef.current && prevMessagesCountRef.current > 0) {
          const latest = newMessages[newMessages.length - 1];
          if (latest.senderUid !== currentUser.uid) {
            sound.playReceive();
          }
        }
        prevMessagesCountRef.current = newMessages.length;
        setMessages(newMessages);

        // Mark incoming unread messages as read
        newMessages.forEach((msg) => {
          if (msg.senderUid !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
            markMessageRead(msg.id, currentUser.uid, msg.readBy || []);
          }
        });
      },
      (err) => {
        console.error('Chat subscription error:', err);
      }
    );

    return () => unsub();
  }, [currentUser, userSlot]);

  // 8. Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Find the latest message sent by current user that has been read by the partner
  const latestReadMessageId = useMemo(() => {
    if (!currentUser) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.senderUid === currentUser.uid) {
        const isRead = Boolean(
          (partnerUid && msg.readBy?.includes(partnerUid)) ||
          (msg.readBy && msg.readBy.some((uid) => uid !== msg.senderUid))
        );
        if (isRead) {
          return msg.id;
        }
      }
    }
    return null;
  }, [messages, currentUser, partnerUid]);

  // Actions
  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    sound.playSend();
    await sendChatMessage(currentUser, partnerUid, text);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentUser || !userSlot || userSlot === 'unauthorized') return;
    updateUserPresence(currentUser, isTyping, userSlot);
  };

  const handleReact = (messageId: string, emoji: string, currentEmoji?: string) => {
    toggleMessageReaction(messageId, emoji, currentEmoji);
  };

  const handleDelete = (messageId: string) => {
    deleteSingleMessage(messageId);
  };

  const handleToggleSound = () => {
    const updated = sound.toggleSound();
    setSoundEnabled(updated);
  };

  const handleUpdateAppName = (newName: string) => {
    setAppName(newName);
    localStorage.setItem('dyad_app_name', newName);
  };

  // Loading State
  if (authLoading || (currentUser && !configLoaded)) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-zinc-500 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            Initializing secure channel...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Auth Screen
  if (!currentUser) {
    return (
      <>
        <OfflineIndicator />
        <AuthScreen 
          appName={appName}
          isPairConfigured={Boolean(config?.user2Uid)}
          onAuthSuccess={() => {}}
        />
      </>
    );
  }

  // Authenticated but unauthorized (not User 1 or User 2): Show Access Denied / Claim Slot
  if (userSlot === 'unauthorized') {
    return (
      <>
        <OfflineIndicator />
        <AccessDeniedScreen 
          currentUser={currentUser}
          config={config}
          onSlotClaimed={() => {}}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-zinc-950 text-zinc-100 select-none overflow-hidden relative">
      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Main App Header */}
      <Header
        appName={appName}
        currentUser={currentUser}
        partnerUser={partnerUser}
        config={config}
        onOpenSettings={() => setShowSettings(true)}
        onOpenExpiryInfo={() => setShowExpiryInfo(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Message Stream Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative overscroll-contain">
        {/* Empty State Banner if no messages yet */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-xl">
              <Lock className="w-6 h-6 text-zinc-300" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Private 2-User Channel Active
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Messages sent here are delivered in real time exclusively to the authorized pair. Every message automatically self-destructs after exactly 5 days.
            </p>

            <div className="mt-6 flex flex-col gap-2 w-full text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>5-Day Auto-Burn:</span>
                </span>
                <span className="text-emerald-400">Enabled</span>
              </div>

              {!partnerUid && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition font-sans text-xs font-medium"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Invite User 2 to Pair</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {/* Top Privacy Notice Badge */}
            <div className="flex justify-center my-3">
              <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Encrypted private session · 5-day auto-purge</span>
              </span>
            </div>

            {/* Messages */}
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isMine={msg.senderUid === currentUser.uid}
                partnerUid={partnerUid}
                partnerName={partnerUser?.displayName || 'Partner'}
                isLatestReadMessage={msg.id === latestReadMessageId}
                onReact={handleReact}
                onDelete={handleDelete}
              />
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </main>

      {/* Message Input Footer */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!partnerUid && messages.length === 0 && !config?.user2Uid}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
        config={config}
        appName={appName}
        onUpdateAppName={handleUpdateAppName}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenExpiryInfo={() => setShowExpiryInfo(true)}
      />

      {/* Expiry / TTL Info Modal */}
      <ExpiryInfoModal
        isOpen={showExpiryInfo}
        onClose={() => setShowExpiryInfo(false)}
      />
    </div>
  );
}
