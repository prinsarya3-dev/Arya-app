import React, { useState } from 'react';
import { ShieldAlert, Key, LogOut, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { type AppUser, type ChatConfig } from '../types';
import { claimSecondUserSlot, claimPrimaryUserSlot } from '../services/chatService';
import { logoutUser } from '../services/firebase';
import { APP_CONFIG } from '../config/appConfig';

interface AccessDeniedScreenProps {
  currentUser: AppUser;
  config: ChatConfig | null;
  onSlotClaimed: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  currentUser,
  config,
  onSlotClaimed,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSlot2Vacant = !config?.user2Uid;
  const isOwner = Boolean(
    currentUser.email &&
    APP_CONFIG.authorizedOwnerEmails.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase())
  );

  const handleClaimOwner = async () => {
    try {
      setLoading(true);
      setError(null);
      const success = await claimPrimaryUserSlot(currentUser);
      if (success) {
        onSlotClaimed();
      } else {
        setError('Failed to update channel ownership.');
      }
    } catch {
      setError('Failed to update channel ownership.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const success = await claimSecondUserSlot(currentUser, inviteCode.trim());
      if (success) {
        onSlotClaimed();
      } else {
        setError('Invalid invite code or pairing is already locked to another account.');
      }
    } catch {
      setError('Failed to claim slot. Please check your code or network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 select-none">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Restricted Communication Channel
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Logged in as <span className="text-zinc-200 font-mono">{currentUser.email || currentUser.uid}</span>
          </p>
        </div>

        {isOwner && (
          <div className="mb-4 rounded-xl bg-sky-950/40 border border-sky-800/60 p-4 text-xs text-sky-200">
            <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Recognized Channel Owner</span>
            </p>
            <p className="text-[11px] text-zinc-300 mb-3">
              Your email is recognized as a channel administrator. You can claim or link the primary User 1 slot directly.
            </p>
            <button
              onClick={handleClaimOwner}
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 text-black font-semibold py-2 text-xs hover:bg-sky-400 transition"
            >
              {loading ? 'Authorizing...' : 'Claim Primary User 1 Slot'}
            </button>
          </div>
        )}

        {isSlot2Vacant ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
              <p className="font-medium text-white mb-1 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-sky-400" />
                <span>Claim the Second User Slot</span>
              </p>
              User 1 has set up this private channel. To link your account as the authorized second participant, enter the 6-character private invite code provided to you.
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/50 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleClaimSlot} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Private Invite Code
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X9K2P"
                  maxLength={12}
                  className="w-full text-center tracking-widest font-mono text-lg rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full rounded-xl bg-sky-500 text-black font-semibold py-2.5 text-xs hover:bg-sky-400 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? 'Verifying Code...' : 'Authorize & Enter Chat'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
              This channel is locked to two specific individuals ({config?.user1Email} and {config?.user2Email || 'User 2'}). No other accounts can read or send messages.
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-center">
          <button
            onClick={() => logoutUser()}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-zinc-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out and switch account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
