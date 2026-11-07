import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

interface ExpiryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpiryInfoModal: React.FC<ExpiryInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(APP_CONFIG.ttlDocumentation.gcloudCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl p-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-white">5-Day Ephemeral Message Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Main Statement */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
            <div>
              <p className="font-semibold text-white">Guaranteed Auto-Deletion</p>
              <p className="text-zinc-400 mt-1">
                Every message sent in Dyad receives an immutable <span className="font-mono text-zinc-200">expireAt</span> timestamp exactly 5 days (120 hours) from creation. Expired messages immediately cease to appear in conversations.
              </p>
            </div>
          </div>

          {/* Dual-Layer Deletion Strategy */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Dual-Layer Permanent Deletion (100% Free / Spark Plan)
            </h3>

            {/* Layer 1: In-App Client Active Cleanup */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-[11px] font-mono flex items-center justify-center text-sky-400">1</span>
                <span>In-App Active Spark Plan Pruning</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Scheduled Cloud Functions normally require the paid Firebase Blaze plan. To keep your app <strong>100% free on the Spark plan</strong>, Dyad runs an active background pruning routine whenever either participant opens the app. It queries and permanently issues <span className="font-mono text-zinc-200">deleteDoc()</span> for any expired records, consuming zero extra cost.
              </p>
            </div>

            {/* Layer 2: Native Firestore TTL */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-[11px] font-mono flex items-center justify-center text-amber-400">2</span>
                <span>Firestore Native TTL Policy (Zero Cost)</span>
              </div>
              <p className="text-zinc-400 text-[11px] mb-2.5">
                Firestore provides a built-in server-side Time-to-Live (TTL) feature that automatically deletes documents when their <span className="font-mono text-zinc-200">expireAt</span> timestamp passes — with <strong>no billing or Blaze plan required</strong>!
              </p>

              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-zinc-400" />
                    <span>Enable native TTL via gcloud CLI:</span>
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="block font-mono text-[11px] text-emerald-400 break-all select-all">
                  {APP_CONFIG.ttlDocumentation.gcloudCommand}
                </code>
              </div>

              <div className="mt-2 text-right">
                <a
                  href={APP_CONFIG.ttlDocumentation.consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                >
                  <span>Open Cloud Console TTL Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Spark Plan Cost Compliance */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2.5 text-[11px] text-zinc-400">
            <DollarSign className="w-4 h-4 text-emerald-400 flex-none" />
            <span>
              All operations are bounded within the Firebase Spark free quota: 50,000 reads/day and 20,000 writes/day.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 rounded-xl bg-zinc-100 text-zinc-950 py-2.5 font-semibold text-xs hover:bg-white transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
