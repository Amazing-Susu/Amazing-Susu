"use client";
import { useState } from "react";

export default function MemberPage() {
  const [member, setMember] = useState<{
    fullName: string;
    phone: string;
    groupAmount: string;
  } | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setMember(data.member);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (member) {
    return (
      <MemberDashboard
        member={member}
        onLogout={async () => {
          await fetch("/api/member/logout", { method: "POST" });
          setMember(null);
          setPhone("");
          setPassword("");
        }}
      />
    );
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0551234567"
              required
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
              required
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            style={{ backgroundColor: "#16a34a" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-4">
          Members are added by the administrator.
        </p>
      </div>
    </div>
  );
}

function MemberDashboard({
  member,
  onLogout,
}: {
  member: { fullName: string; phone: string; groupAmount: string };
  onLogout: () => void;
}) {
  const contributionAmount = Number(member.groupAmount);
  const netPayout = 20 * contributionAmount - 50;

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="text-white px-5 pt-5 pb-16 rounded-b-3xl"
        style={{ backgroundColor: "#16a34a" }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <div className="text-xs opacity-90">Welcome back</div>
            <div className="text-xl font-bold">{member.fullName}</div>
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
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">Your Group</div>
              <div className="text-lg font-bold text-slate-800">
                GH₵{contributionAmount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Weekly Due</div>
              <div className="text-lg font-bold text-slate-800">
                GH₵{contributionAmount}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#15803d" }}
          >
            Your Expected Payout
          </div>
          <div
            className="text-3xl font-bold mt-1"
            style={{ color: "#052e16" }}
          >
            GH₵{netPayout.toLocaleString()}
          </div>
          <p className="text-xs mt-1" style={{ color: "#15803d" }}>
            (GH₵{(20 * contributionAmount).toLocaleString()} gross − GH₵50 fee)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-2">Your Account</h3>
          <div className="text-sm text-slate-600 space-y-1">
            <div>
              <span className="text-slate-400">Phone: </span>
              {member.phone}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">Payment History</h3>
          <div className="text-center py-8 text-slate-400 text-sm">
            No payments yet.
            <br />
            Once you start contributing, they'll appear here.
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-4">
          More features coming soon.
        </div>
      </div>
    </div>
  );
}
