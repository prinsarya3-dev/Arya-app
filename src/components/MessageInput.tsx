import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = [
  '❤️', '✨', '🔥', '😂', '👍', '😊', '🙏', '😍', 
  '👀', '🥺', '🎉', '💯', '👏', '💬', '🌟', '🌙',
  '☕', '🚀', '🫂', '🤝', '🔒', '🖤', '🤍', '⚡'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Notify typing
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(false);

      await onSendMessage(trimmed);
      setText('');
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex-none border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md p-3 pb-safe z-20">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="mb-2 p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800/80 px-1">
            <span className="text-[11px] font-mono text-zinc-400">Quick Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-xl hover:bg-zinc-800 active:scale-95 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl border transition ${
            showEmojiPicker 
              ? 'bg-zinc-800 text-sky-400 border-zinc-700' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
          }`}
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <div className="flex-1 relative rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a private message..."
            rows={1}
            maxLength={2000}
            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-32 leading-relaxed"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isSubmitting || disabled}
          className={`p-2.5 rounded-xl transition flex items-center justify-center ${
            text.trim() && !isSubmitting && !disabled
              ? 'bg-zinc-100 text-zinc-950 hover:bg-white active:scale-95 shadow-md shadow-white/5'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-800/80 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
