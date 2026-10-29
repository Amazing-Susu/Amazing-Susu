"use client";
import { useState, useEffect } from "react";

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [device, setDevice] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    const isDismissed = localStorage.getItem("installBannerDismissed") === "true";

    if (isStandalone || isDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDevice("ios");
      setShowBanner(true);
    } else if (/android/.test(userAgent)) {
      setDevice("android");
      setShowBanner(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("installBannerDismissed", "true");
    setShowBanner(false);
  }

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-green-200 max-w-md mx-auto p-5 relative">
        <button onClick={dismiss} className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-2">✕</button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-green-100 p-2 rounded-xl text-2xl">🌳</div>
          <div>
            <h3 className="font-bold text-slate-800">Install Amazing Susu</h3>
            <p className="text-xs text-slate-500">Add to your home screen for quick access.</p>
          </div>
        </div>

        {device === "ios" && (
          <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="mb-2">To install on your iPhone:</p>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Tap the <strong>Share</strong> button <span className="inline-block border border-slate-300 rounded px-1">⬆️</span> at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <span className="inline-block border border-slate-300 rounded px-1">➕</span>.</li>
            </ol>
          </div>
        )}

        {device === "android" && (
          <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="mb-2">To install on your Android:</p>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Tap the <strong>three dots</strong> <span className="inline-block border border-slate-300 rounded px-1">⋮</span> in the top right corner.</li>
              <li>Tap <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
