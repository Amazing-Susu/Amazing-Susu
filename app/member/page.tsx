"use client";
import { useState } from "react";

export default function MemberPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  if (loggedIn) {
    return <MemberDashboard onLogout={() => setLoggedIn(false)} />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}
    >
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a3d2a" }}>
            Amazing <span style={{ color: "#16a34a" }}>Susu</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Member Login</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 55 123 4567"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2"
            />
          </div>
          <button
            onClick={() => setLoggedIn(true)}
            className="w-full text-white font-semibold py-3 rounded-xl"
            style={{ backgroundColor: "#16a34a" }}
          >
            Sign In
          </button>
          <p className="text-xs text-center text-slate-400">
            Real authentication arrives in the next stage.
          </p>
        </div>
      </div>
    </div>
  );
}

function MemberDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="text-white px-5 pt-5 pb-16 rounded-b-3xl"
        style={{ backgroundColor: "#16a34a" }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <div className="text-xs opacity-90">Welcome back</div>
            <div className="text-xl font-bold">Member</div>
          </div>
          <button
            onClick={onLogout}
            className="text-xs opacity-90 hover:opacity-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-12 space-y-4 pb-10">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 text-center">
          <div className="text-4xl mb-2">🌱</div>
          <p className="text-slate-500 text-sm">
            Your dashboard will appear here once you're added to a group.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Members are added by the administrator.
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#15803d" }}>
            Your Expected Payout
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: "#052e16" }}>
            — — —
          </div>
          <p className="text-xs mt-1" style={{ color: "#15803d" }}>
            Will appear once you join a group.
          </p>
        </div>
      </div>
    </div>
  );
}
