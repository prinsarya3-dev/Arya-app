import React, { useState } from 'react';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Flame, 
  Trash2, 
  Eye, 
  Sparkles 
} from 'lucide-react';
import { type ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  isMine: boolean;
  partnerUid?: string;
  partnerName?: string;
  isLatestReadMessage?: boolean;
  onReact: (messageId: string, emoji: string, currentEmoji?: string) => void;
  onDelete?: (messageId: string) => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '🔥', '😂', '🔒'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMine,
  partnerUid,
  partnerName = 'Partner',
  isLatestReadMessage = false,
  onReact,
  onDelete,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Format creation time
  const createdAtDate = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();
  const timeString = createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Expiration calculation
  const expireDate = message.expireAt?.toDate ? message.expireAt.toDate() : new Date(Date.now() + 5 * 86400000);
  const msRemaining = Math.max(0, expireDate.getTime() - Date.now());
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);
  const remHours = hoursRemaining % 24;

  let expiryLabel = '';
  if (daysRemaining > 0) {
    expiryLabel = `${daysRemaining}d ${remHours}h`;
  } else if (hoursRemaining > 0) {
    expiryLabel = `${hoursRemaining}h left`;
  } else {
    const mins = Math.max(1, Math.floor(msRemaining / (1000 * 60)));
    expiryLabel = `${mins}m left`;
  }

  // Enhanced read tracking:
  // Evaluates if partnerUid is in readBy, OR if readBy contains any UID other than message.senderUid
  const isReadByPartner = Boolean(
    (partnerUid && message.readBy?.includes(partnerUid)) ||
    (message.readBy && message.readBy.some((uid) => uid !== message.senderUid))
  );

  return (
    <div 
      className={`group relative flex flex-col mb-3 select-text ${isMine ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Sender name for received messages */}
      {!isMine && (
        <span className="text-[11px] font-medium text-zinc-500 mb-1 px-1 flex items-center gap-1">
          <span>{message.senderName || partnerName}</span>
        </span>
      )}

      {/* Message Bubble Container */}
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Quick Reaction & Action Popover */}
        {showOptions && (
          <div 
            className={`absolute -top-9 z-10 flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-700/80 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
              isMine ? 'right-0' : 'left-0'
            }`}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji, message.reaction)}
                className={`w-6 h-6 flex items-center justify-center text-xs rounded-full hover:bg-zinc-800 transition ${
                  message.reaction === emoji ? 'bg-zinc-800 scale-110' : ''
                }`}
              >
                {emoji}
              </button>
            ))}

            {isMine && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                title="Delete message"
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition ml-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          onClick={() => setShowDetails(!showDetails)}
          className={`cursor-pointer px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed transition-all break-words relative overflow-hidden ${
            isMine
              ? isReadByPartner
                ? 'bg-zinc-100 text-zinc-950 font-normal rounded-tr-xs shadow-md border-r-2 border-r-sky-500/80 ring-1 ring-sky-500/20'
                : 'bg-zinc-100 text-zinc-950 font-normal rounded-tr-xs shadow-md'
              : 'bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-xs shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Footer Metadata: Expiry tag + Time + Enhanced Read Receipt */}
          <div 
            className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-mono select-none ${
              isMine ? 'text-zinc-600' : 'text-zinc-500'
            }`}
          >
            {/* Expiry Pill */}
            <span 
              title={`Expires at ${expireDate.toLocaleString()}`}
              className={`inline-flex items-center gap-0.5 px-1 rounded ${
                daysRemaining <= 1 
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' 
                  : isMine 
                    ? 'bg-zinc-200/80 text-zinc-700' 
                    : 'bg-zinc-800/80 text-zinc-400'
              }`}
            >
              <Flame className="w-2.5 h-2.5 text-amber-500" />
              <span>{expiryLabel}</span>
            </span>

            {/* Time */}
            <span className="tabular-nums">{timeString}</span>

            {/* Distinct Delivery & Read Status Indicators */}
            {isMine && (
              <div 
                className="inline-flex items-center ml-0.5"
                title={isReadByPartner ? `Read by ${partnerName}` : 'Delivered (not read yet)'}
              >
                {isReadByPartner ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-600 font-sans font-semibold tracking-tight animate-in zoom-in-75 duration-200">
                    <CheckCheck className="w-3.5 h-3.5 text-sky-500 drop-shadow-[0_0_6px_rgba(14,165,233,0.5)] stroke-[2.5]" />
                    <span className="text-[9px]">Read</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-zinc-500 font-sans">
                    <Check className="w-3 h-3 text-zinc-500 stroke-[2]" />
                    <span className="text-[9px] text-zinc-500">Sent</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reaction Pill attached to bottom corner */}
        {message.reaction && (
          <button
            onClick={() => onReact(message.id, message.reaction!, message.reaction)}
            title="Click to remove reaction"
            className={`absolute -bottom-2.5 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-700 shadow-md hover:scale-105 transition-transform ${
              isMine ? 'right-2' : 'left-2'
            }`}
          >
            <span>{message.reaction}</span>
          </button>
        )}
      </div>

      {/* Latest Read Message Marker Badge */}
      {isMine && isLatestReadMessage && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-sky-400/90 font-mono pr-1 select-none animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
          <span>Seen by {partnerName}</span>
        </div>
      )}

      {/* Expanded Details on tap */}
      {showDetails && (
        <div 
          className={`mt-1.5 text-[11px] font-mono px-1 space-y-0.5 animate-in fade-in duration-150 ${
            isMine ? 'text-right' : 'text-left'
          }`}
        >
          <div className="text-zinc-500">
            Created: {createdAtDate.toLocaleTimeString()} · Burns in {expiryLabel}
          </div>
          {isMine && (
            <div className="flex items-center gap-1 justify-end font-sans">
              {isReadByPartner ? (
                <span className="text-sky-400 font-medium flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read by {partnerName} · Confirmed</span>
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Delivered to channel · Waiting for {partnerName} to open</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
