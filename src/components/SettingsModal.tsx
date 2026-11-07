import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Shield, 
  Users, 
  Flame, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Edit3, 
  Save, 
  Key, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { type AppUser, type ChatConfig } from '../types';
import { logoutUser } from '../services/firebase';
import { updateChatConfig } from '../services/chatService';
import { APP_CONFIG } from '../config/appConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  config: ChatConfig | null;
  appName: string;
  onUpdateAppName: (newName: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenExpiryInfo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  config,
  appName,
  onUpdateAppName,
  soundEnabled,
  onToggleSound,
  onOpenExpiryInfo,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(appName);
  const [customUser2Email, setCustomUser2Email] = useState(config?.user2Email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSavedToast, setEmailSavedToast] = useState(false);

  if (!isOpen) return null;

  const isUser1 = config?.user1Uid === currentUser.uid || currentUser.email === APP_CONFIG.defaultUser1Email;

  const handleCopyInviteCode = () => {
    if (config?.inviteCode) {
      navigator.clipboard.writeText(config.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveAppName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onUpdateAppName(trimmed);
    setEditingName(false);
    if (isUser1) {
      await updateChatConfig({ appName: trimmed });
    }
  };

  const handleSaveUser2Email = async () => {
    if (!isUser1) return;
    try {
      setSavingEmail(true);
      await updateChatConfig({ user2Email: customUser2Email.trim() });
      setEmailSavedToast(true);
      setTimeout(() => setEmailSavedToast(false), 2500);
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Channel Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs text-zinc-300">
          {/* App Name Section (Configurable requirement) */}
          <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-zinc-300">App Name (Configurable)</span>
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Rename</span>
                </button>
              )}
            </div>

            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={32}
                  className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleSaveAppName}
                  className="flex items-center gap-1 rounded-lg bg-zinc-100 text-zinc-950 px-3 py-1.5 font-medium hover:bg-white"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-white tracking-wide">{appName}</p>
            )}
          </div>

          {/* User Profile Info */}
          <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-800/80">
            <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-mono">
              Your Profile
            </span>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">
                  {currentUser.displayName || 'Participant'}
                </p>
                <p className="text-zinc-500 font-mono text-[11px]">
                  {currentUser.email || currentUser.uid}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                {currentUser.uid === config?.user1Uid ? 'User 1 (Admin)' : 'User 2 (Partner)'}
              </span>
            </div>
          </div>

          {/* Two-User Pairing & Invite Code */}
          <div className="rounded-xl bg-zinc-950 p-3.5 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Authorized Pair (Max 2)</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                config?.user2Uid 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-amber-950 text-amber-400 border border-amber-800/60'
              }`}>
                {config?.user2Uid ? 'Pair Complete' : '1 Slot Vacant'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-500">User 1:</span>
                <span className="text-zinc-300 font-mono">{config?.user1Email || 'Not initialized'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">User 2:</span>
                <span className="text-zinc-300 font-mono">
                  {config?.user2Uid 
                    ? (config.user2Email || 'Connected') 
                    : config?.user2Email || 'Unclaimed'}
                </span>
              </div>
            </div>

            {/* Invite Code for User 2 */}
            {config?.inviteCode && (
              <div className="pt-2 border-t border-zinc-850">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                    <Key className="w-3 h-3 text-sky-400" />
                    <span>Invite Code for User 2</span>
                  </span>
                  <button
                    onClick={handleCopyInviteCode}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-center font-mono text-base font-bold tracking-widest text-sky-300">
                  {config.inviteCode}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Share this secret code with your second user. They will enter it upon logging in to permanently link.
                </p>
              </div>
            )}

            {/* Admin can pre-assign User 2 Email */}
            {isUser1 && !config?.user2Uid && (
              <div className="pt-2 border-t border-zinc-850">
                <label className="block text-zinc-400 text-[11px] mb-1">
                  Or Pre-Authorize User 2 Email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customUser2Email}
                    onChange={(e) => setCustomUser2Email(e.target.value)}
                    placeholder="partner@example.com"
                    className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    onClick={handleSaveUser2Email}
                    disabled={savingEmail}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700 transition"
                  >
                    {emailSavedToast ? 'Saved!' : 'Authorize'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ephemeral Message Info Trigger */}
          <button
            onClick={() => {
              onClose();
              onOpenExpiryInfo();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-left transition"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <div>
                <p className="font-semibold text-white text-xs">5-Day Ephemeral Deletion</p>
                <p className="text-zinc-500 text-[11px]">Active Firestore TTL policy details</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {/* Preferences */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-zinc-300 font-medium">Sound Effects</span>
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border transition ${
                soundEnabled 
                  ? 'bg-zinc-900 border-zinc-700 text-sky-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => {
              onClose();
              logoutUser();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-950/80 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition font-medium text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of {appName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
