"use client";
import { useState } from "react";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setAdminName(data.admin.fullName);
      setLoggedIn(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loggedIn) {
    return <AdminDashboard adminName={adminName} onLogout={async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      setLoggedIn(false);
      setIdentifier("");
      setPassword("");
    }} />;
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
          <p className="text-sm text-slate-500 mt-1">Administrator Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email or Phone Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@amazingsusu.com"
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
          Authorized personnel only.
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({
  adminName,
  onLogout,
}: {
  adminName: string;
  onLogout: () => void;
}) {
  const kpis = [
    {
      label: "Total Members",
      value: "0",
      sub: "Start adding members",
      icon: "👥",
      color: "linear-gradient(135deg, #16a34a, #15803d)",
    },
    {
      label: "Total Contributions (GH₵)",
      value: "0.00",
      sub: "No payments yet",
      icon: "💵",
      color: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    },
    {
      label: "Total Weeks Paid",
      value: "0",
      sub: "Awaiting first payment",
      icon: "📅",
      color: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    },
    {
      label: "Active Groups",
      value: "9",
      sub: "All tiers ready",
      icon: "📊",
      color: "linear-gradient(135deg, #ea580c, #c2410c)",
    },
  ];

  const navItems = [
    { icon: "🏠", label: "Dashboard", active: true },
    { icon: "👥", label: "Members" },
    { icon: "📁", label: "Groups" },
    { icon: "💳", label: "Payments" },
    { icon: "💰", label: "Payouts" },
    { icon: "✅", label: "Approvals", badge: 3 },
    { icon: "📊", label: "Reports" },
    { icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className="hidden md:flex flex-col w-60 text-white"
        style={{ backgroundColor: "#0a3d2a" }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: "#16a34a" }}
            >
              🌱
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">
                Amazing<span style={{ color: "#4ade80" }}>Susu</span>
              </div>
              <div className="text-[10px] opacity-70">
                Save Together • Grow Together
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer justify-between"
              style={
                item.active ? { backgroundColor: "#16a34a" } : undefined
              }
            >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span> {item.label}
              </span>
              {item.badge && (
                <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full text-xs opacity-70 hover:opacity-100"
          >
            Sign Out →
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-800">
            👋 Welcome, {adminName}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: "#16a34a" }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Here's what's happening today.
            </h2>
            <p className="text-sm text-slate-500">
              Numbers below will fill in as you add members and receive
              payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl p-5 text-white relative overflow-hidden shadow"
                style={{ background: kpi.color }}
              >
                <div className="absolute right-3 top-3 text-6xl opacity-20">
                  {kpi.icon}
                </div>
                <div className="text-sm opacity-90 mb-1">{kpi.label}</div>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <div className="text-xs mt-2 opacity-90">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Recent Payments</h3>
            <div className="text-center py-12 text-slate-400 text-sm">
              No payments yet.
              <br />
              Once members start submitting, they'll appear here.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
