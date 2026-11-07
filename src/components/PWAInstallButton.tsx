import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install app to your home screen"
        className={`flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow-sm ${
          compact ? 'px-2 py-1' : ''
        }`}
      >
        <Download className="w-3.5 h-3.5 text-sky-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone / iPad"
          className={`flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition ${
            compact ? 'px-2 py-1' : ''
          }`}
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                  Install Dyad on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-3 rounded-xl bg-zinc-950 p-3 border border-zinc-800/80">
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-sky-400 mt-0.5">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">1. Tap the Share button</span>
                    <p className="text-zinc-400 mt-0.5">Located in the bottom Safari toolbar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-zinc-950 p-3 border border-zinc-800/80">
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-emerald-400 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">2. Select &ldquo;Add to Home Screen&rdquo;</span>
                    <p className="text-zinc-400 mt-0.5">Scroll down in the share sheet and tap Add.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-medium text-white hover:bg-zinc-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
