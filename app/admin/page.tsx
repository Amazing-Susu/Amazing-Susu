"use client";
import { useState, useEffect } from "react";

type AdminInfo = { fullName: string; email: string };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.admin) {
          setAdminName(d.admin.fullName);
          setLoggedIn(true);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}
      >
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <AdminLogin
        onSuccess={(name) => {
          setAdminName(name);
          setLoggedIn(true);
        }}
      />
    );
  }

  return (
    <AdminShell
      adminName={adminName}
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setLoggedIn(false);
        setCurrentView("dashboard");
      }}
    />
  );
}

// ==================== LOGIN ====================

function AdminLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
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
      onSuccess(data.admin.fullName);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
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
            className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60"
            style={{ backgroundColor: "#16a34a" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== SHELL ====================

function AdminShell({
  adminName,
  currentView,
  onNavigate,
  onLogout,
}: {
  adminName: string;
  currentView: string;
  onNavigate: (v: string) => void;
  onLogout: () => void;
}) {
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "members", icon: "👥", label: "Members" },
    { id: "groups", icon: "📁", label: "Groups" },
    { id: "payments", icon: "💳", label: "Payments" },
    { id: "payouts", icon: "💰", label: "Payouts" },
    { id: "approvals", icon: "✅", label: "Approvals", badge: 0 },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "settings", icon: "⚙️", label: "Settings" },
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
          {navItems.map((item) => {
            const active = item.id === currentView;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer justify-between text-left"
                style={active ? { backgroundColor: "#16a34a" } : undefined}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span> {item.label}
                </span>
                {item.badge ? (
                  <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full text-xs opacity-70 hover:opacity-100 text-left"
          >
            Sign Out →
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg text-slate-800">
              {navItems.find((n) => n.id === currentView)?.label || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: "#16a34a" }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700">
              {adminName}
            </span>
          </div>
        </header>

        <div className="p-6">
          {currentView === "dashboard" && (
            <DashboardView adminName={adminName} />
          )}
          {currentView === "members" && <MembersView />}
          {currentView !== "dashboard" && currentView !== "members" && (
            <ComingSoon view={currentView} />
          )}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD VIEW ====================

function DashboardView({ adminName }: { adminName: string }) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          👋 Welcome, {adminName}
        </h2>
        <p className="text-sm text-slate-500">
          Numbers below will fill in as you add members and receive payments.
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
  );
}

// ==================== MEMBERS VIEW ====================

type MemberRow = {
  id: string;
  fullName: string;
  phone: string;
  groupAmount: string;
  status: string;
  preferredPayoutWeek: number | null;
  joinedAt: string;
};

function MembersView() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/members")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        return data;
      })
      .then((d) => setMembers(d.members || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
        Loading members…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500">
            {members.length} member{members.length === 1 ? "" : "s"} in your
            Susu system
          </p>
        </div>
        <button
          className="text-white font-semibold px-5 py-2.5 rounded-xl"
          style={{ backgroundColor: "#16a34a" }}
        >
          + Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">👥</div>
          <h3 className="font-bold text-slate-800 mb-1">No members yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Members you add will appear here.
          </p>
          <button
            className="text-white font-semibold px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#16a34a" }}
          >
            + Add Your First Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: "#16a34a" }}
                        >
                          {m.fullName.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                    <td className="px-4 py-3">GH₵{m.groupAmount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          m.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-semibold text-green-700 hover:underline">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMING SOON ====================

function ComingSoon({ view }: { view: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
      <div className="text-5xl mb-3">🚧</div>
      <h3 className="font-bold text-slate-800 mb-1 capitalize">{view}</h3>
      <p className="text-sm text-slate-500">
        This section is coming in the next stage.
      </p>
    </div>
  );
}
