import React from 'react';
import { 
  Shield, 
  Flame, 
  Settings, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  UserX,
  Sparkles
} from 'lucide-react';
import { type AppUser, type ChatConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { sound } from '../services/sound';

interface HeaderProps {
  appName: string;
  currentUser: AppUser;
  partnerUser: AppUser | null;
  config: ChatConfig | null;
  onOpenSettings: () => void;
  onOpenExpiryInfo: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  partnerUser,
  config,
  onOpenSettings,
  onOpenExpiryInfo,
  soundEnabled,
  onToggleSound,
}) => {
  const isPartnerConfigured = Boolean(config?.user2Uid || config?.user2Email);
  const isPartnerOnline = partnerUser?.lastSeen && (
    Date.now() - (
      typeof partnerUser.lastSeen === 'object' && 'toMillis' in partnerUser.lastSeen 
        ? partnerUser.lastSeen.toMillis() 
        : Number(partnerUser.lastSeen)
    ) < 60000
  );

  return (
    <header className="flex-none h-16 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between z-20">
      {/* Brand & Partner Status */}
      <div className="flex items-center gap-3">
        {/* App Logo Emblem */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-inner">
          <Shield className="w-4 h-4 text-zinc-400" />
          {/* Active status pulse */}
          <span 
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
              isPartnerOnline ? 'bg-emerald-500 animate-pulse' : isPartnerConfigured ? 'bg-zinc-600' : 'bg-amber-500'
            }`} 
            title={isPartnerOnline ? 'Partner is active now' : 'Partner offline'}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              <span>{appName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                2P
              </span>
            </h1>
          </div>

          {/* Subtitle / Presence */}
          <div className="flex items-center gap-1.5 text-xs">
            {partnerUser?.isTyping ? (
              <span className="text-sky-400 font-medium flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                Partner is typing...
              </span>
            ) : isPartnerOnline ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Partner online
              </span>
            ) : isPartnerConfigured ? (
              <span className="text-zinc-500 truncate max-w-[140px] sm:max-w-none">
                {partnerUser?.displayName || config?.user2Email || 'Partner connected'}
              </span>
            ) : (
              <span className="text-amber-400/90 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Awaiting User 2 invite
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton compact />

        {/* 5-Day Auto-Burn Indicator */}
        <button
          onClick={onOpenExpiryInfo}
          title="Auto-deletion policy: Messages expire after 5 days"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800/90 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition group"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-mono text-[11px]">5d burn</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-zinc-300" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-600" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Settings and access control"
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
