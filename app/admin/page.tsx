"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.admin) { setAdminName(d.admin.fullName); setLoggedIn(true); } })
      .finally(() => setChecking(false));
  }, []);

  function handleNavigate(view: string) {
    if (view !== "members") setSelectedMemberId(null);
    setCurrentView(view);
    setMobileMenuOpen(false);
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}><div className="text-slate-500">Loading…</div></div>;

  if (!loggedIn) return <AdminLogin onSuccess={(name) => { setAdminName(name); setLoggedIn(true); }} />;

  return (
    <AdminShell
      adminName={adminName}
      currentView={currentView}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      onNavigate={handleNavigate}
      onLogout={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setLoggedIn(false);
        setCurrentView("dashboard");
        setSelectedMemberId(null);
      }}
    >
      {currentView === "dashboard" && <DashboardView adminName={adminName} refreshKey={refreshKey} />}
      {currentView === "members" && !selectedMemberId && <MembersView onViewMember={setSelectedMemberId} />}
      {currentView === "members" && selectedMemberId && (
        <MemberDetailView memberId={selectedMemberId} onBack={() => { setSelectedMemberId(null); setRefreshKey((k) => k + 1); }} />
      )}
      {currentView === "groups" && <GroupsView />}
      {currentView === "payments" && <PaymentsView onChanged={() => setRefreshKey((k) => k + 1)} />}
      {currentView === "payouts" && <PayoutsView />}
      {currentView !== "dashboard" && currentView !== "members" && currentView !== "groups" && currentView !== "payments" && currentView !== "payouts" && <ComingSoon view={currentView} />}
    </AdminShell>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      onSuccess(data.admin.fullName);
    } catch { setError("Network error. Please try again."); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a3d2a" }}>Amazing <span style={{ color: "#16a34a" }}>Susu</span></h1>
          <p className="text-sm text-slate-500 mt-1">Administrator Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-sm font-semibold text-slate-700">Email or Phone Number</label><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          <div><label className="text-sm font-semibold text-slate-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

function AdminShell({ adminName, currentView, mobileMenuOpen, setMobileMenuOpen, onNavigate, onLogout, children }: { adminName: string; currentView: string; mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void; onNavigate: (v: string) => void; onLogout: () => void; children: React.ReactNode; }) {
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "members", icon: "👥", label: "Members" },
    { id: "groups", icon: "📁", label: "Groups" },
    { id: "payments", icon: "💳", label: "Payments" }, // Renamed from Approvals
    { id: "payouts", icon: "💰", label: "Payouts" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 text-white transform transition-transform duration-200 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex flex-col`} style={{ backgroundColor: "#0a3d2a" }}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: "#16a34a" }}>🌱</div>
            <div>
              <div className="font-bold text-lg leading-tight">Amazing<span style={{ color: "#4ade80" }}>Susu</span></div>
              <div className="text-[10px] opacity-70">Save Together • Grow Together</div>
            </div>
          </div>
          <button className="md:hidden text-white/70 text-xl" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.id === currentView;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer justify-between text-left" style={active ? { backgroundColor: "#16a34a" } : undefined}>
                <span className="flex items-center gap-3"><span>{item.icon}</span><span>{item.label}</span></span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10"><button onClick={onLogout} className="w-full text-xs opacity-70 hover:opacity-100 text-left">Sign Out →</button></div>
      </aside>

      <main className="flex-1 overflow-auto w-full">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-2xl text-slate-600" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <span className="font-bold text-lg text-slate-800">{navItems.find((n) => n.id === currentView)?.label || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: "#16a34a" }}>{adminName.charAt(0).toUpperCase()}</div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700">{adminName}</span>
          </div>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD ====================

function DashboardView({ adminName, refreshKey }: { adminName: string; refreshKey: number }) {
  const [stats, setStats] = useState({ totalMembers: 0, totalContributions: 0, totalWeeksPaid: 0, activeGroups: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => { if (d.totalMembers !== undefined) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const kpis = [
    { label: "Total Members", value: stats.totalMembers.toString(), sub: "Active members", icon: "👥", color: "linear-gradient(135deg, #16a34a, #15803d)" },
    { label: "Total Contributions (GH₵)", value: stats.totalContributions.toLocaleString(), sub: "Verified payments", icon: "💵", color: "linear-gradient(135deg, #2563eb, #1d4ed8)" },
    { label: "Total Weeks Paid", value: stats.totalWeeksPaid.toString(), sub: "Fully paid weeks", icon: "📅", color: "linear-gradient(135deg, #7c3aed, #6d28d9)" },
    { label: "Active Groups", value: stats.activeGroups.toString(), sub: "Groups with members", icon: "📊", color: "linear-gradient(135deg, #ea580c, #c2410c)" },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">👋 Welcome, {adminName}</h2><p className="text-sm text-slate-500">Here's what's happening with your Susu today.</p></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5 text-white relative overflow-hidden shadow" style={{ background: kpi.color }}>
            <div className="absolute right-3 top-3 text-6xl opacity-20">{kpi.icon}</div>
            <div className="text-sm opacity-90 mb-1">{kpi.label}</div>
            <div className="text-3xl font-bold">{loading ? <span className="opacity-50 text-xl">…</span> : kpi.value}</div>
            <div className="text-xs mt-2 opacity-90">{kpi.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== GROUPS VIEW ====================

type GroupData = { id: string; contributionAmount: string; maxMembers: number; currentMembers: number; availableSlots: number };

function GroupsView() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/groups").then(r => r.json()).then(d => setGroups(d.groups || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading groups…</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Groups Overview</h2><p className="text-sm text-slate-500">Manage your 9 contribution tiers and their capacity.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => {
          const isFull = g.availableSlots <= 0;
          const percentage = (g.currentMembers / g.maxMembers) * 100;
          const payout = (20 * Number(g.contributionAmount)) - 50;

          return (
            <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div><div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Contribution</div><div className="text-2xl font-bold text-slate-800">GH₵{g.contributionAmount}</div></div>
                <div className={`text-xs px-2 py-1 rounded-full font-semibold ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{isFull ? 'FULL' : `${g.availableSlots} slots left`}</div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Members</span><span className="font-semibold text-slate-800">{g.currentMembers} / {g.maxMembers}</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${percentage}%` }}></div></div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center"><div className="text-xs text-slate-500">Expected Payout</div><div className="font-bold text-green-700">GH₵{payout.toLocaleString()}</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== PAYMENTS VIEW (Previously Approvals) ====================

type PaymentRow = {
  id: string; reference: string; amount: number; method: string; status: string; date: string;
  memberName: string; memberPhone: string; groupAmount: number; weekNumber: number;
};

function PaymentsView({ onChanged }: { onChanged: () => void }) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/payments/all")
      .then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Failed to load"); return data; })
      .then((d) => setPayments(d.payments || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function reload() { setRefreshKey((k) => k + 1); onChanged(); }

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading payments…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Payments Ledger</h2>
          <p className="text-sm text-slate-500">Master record of all contributions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700">↻ Refresh</button>
          <button onClick={() => setShowRecordModal(true)} className="text-white font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#16a34a" }}>+ Record Payment</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Date / Time</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Week</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No payments recorded yet.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.date).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{p.memberName}</div>
                      <div className="text-xs text-slate-500">{p.memberPhone}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">Wk {p.weekNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">GH₵{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{p.method.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === "VERIFIED" ? "bg-green-100 text-green-700" : p.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRecordModal && <RecordPaymentModal onClose={() => setShowRecordModal(false)} onSuccess={() => { setShowRecordModal(false); reload(); }} />}
    </div>
  );
}

function RecordPaymentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [members, setMembers] = useState<{id: string, fullName: string, phone: string}[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({ memberId: "", amount: "", paymentMethod: "MTN_MOMO", transactionId: "" });

  useEffect(() => {
    fetch("/api/admin/members")
      .then(r => r.json())
      .then(d => setMembers((d.members || []).filter((m: any) => m.status === "ACTIVE")))
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payments/record", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to record"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Select Member *</label>
            {loadingMembers ? <div className="text-sm text-slate-400 py-2">Loading members…</div> : (
              <select required value={form.memberId} onChange={e => setForm({...form, memberId: e.target.value})} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
                <option value="">— Choose Member —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Amount (GH₵) *</label>
            <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="e.g. 500" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 font-bold text-lg" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Payment Method *</label>
            <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
              <option value="MTN_MOMO">MTN Mobile Money</option>
              <option value="TELECEL_CASH">Telecel Cash</option>
              <option value="AIRTELTIGO_MONEY">AirtelTigo Money</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Transaction Ref (optional)</label>
            <input type="text" value={form.transactionId} onChange={e => setForm({...form, transactionId: e.target.value})} placeholder="e.g. MoMo ID" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting || loadingMembers} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Saving…" : "Save Payment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MEMBERS VIEW ====================

type MemberRow = { id: string; fullName: string; phone: string; groupAmount: string; status: string; joinedAt: string };

function MembersView({ onViewMember }: { onViewMember: (id: string) => void }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/members").then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Failed to load"); return data; }).then((d) => setMembers(d.members || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading members…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h2 className="text-2xl font-bold text-slate-800">Members</h2><p className="text-sm text-slate-500">{members.length} member{members.length === 1 ? "" : "s"} in your Susu system</p></div>
          <button onClick={() => setShowAdd(true)} className="text-white font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#16a34a" }}>+ Add Member</button>
        </div>
        {members.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">👥</div><h3 className="font-bold text-slate-800 mb-1">No members yet</h3><p className="text-sm text-slate-500 mb-6">Members you add will appear here.</p>
            <button onClick={() => setShowAdd(true)} className="text-white font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#16a34a" }}>+ Add Your First Member</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium">Group</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium text-right">Action</th></tr>
                </thead>
                <tbody className="text-slate-700">
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#16a34a" }}>{m.fullName.charAt(0).toUpperCase()}</span><span className="font-semibold">{m.fullName}</span></div></td>
                      <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                      <td className="px-4 py-3">GH₵{m.groupAmount}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{m.status}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(m.joinedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right"><button onClick={() => onViewMember(m.id)} className="text-xs font-semibold text-green-700 hover:underline">View →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); setRefreshKey((k) => k + 1); }} />}
    </>
  );
}

type GroupOption = { id: string; contributionAmount: string; maxMembers: number; currentMembers: number; availableSlots: number };

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", whatsappNumber: "", dateOfBirth: "", address: "", emergencyContact: "", password: "", groupId: "", preferredPayoutWeek: "" });

  useEffect(() => {
    fetch("/api/admin/groups").then((r) => r.json()).then((d) => setGroups(d.groups || [])).catch(() => {}).finally(() => setLoadingGroups(false));
  }, []);

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create member"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  const selectedGroup = groups.find((g) => g.id === form.groupId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Add New Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *"><input type="text" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Phone Number *"><input type="text" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0551234567" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="WhatsApp Number"><input type="text" value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Date of Birth *"><input type="date" required value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Emergency Contact *"><input type="text" required value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Address *"><input type="text" required value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contribution Group *">
              {loadingGroups ? (<div className="text-slate-400 text-sm py-2">Loading groups…</div>) : (
                <select required value={form.groupId} onChange={(e) => update("groupId", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
                  <option value="">— Select group —</option>
                  {groups.map((g) => (<option key={g.id} value={g.id} disabled={g.availableSlots <= 0}>GH₵{g.contributionAmount} ({g.availableSlots} slots left){g.availableSlots <= 0 ? " — FULL" : ""}</option>))}
                </select>
              )}
            </Field>
            <Field label="Preferred Payout Week (optional)"><input type="number" min="1" max="20" value={form.preferredPayoutWeek} onChange={(e) => update("preferredPayoutWeek", e.target.value)} placeholder="1–20" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
          </div>
          <Field label="Login Password / PIN * (for the member to log in)"><input type="text" required minLength={4} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Set a password or 4-digit PIN" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 font-mono" /></Field>
          {selectedGroup && (
            <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="font-semibold mb-1" style={{ color: "#15803d" }}>Preview</div>
              <div className="text-slate-700">Weekly contribution: <strong>GH₵{selectedGroup.contributionAmount}</strong><br />Expected payout: <strong>GH₵{(20 * Number(selectedGroup.contributionAmount) - 50).toLocaleString()}</strong><span className="text-xs text-slate-500"> (20 × GH₵{selectedGroup.contributionAmount} − GH₵50 fee)</span></div>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Creating…" : "Create Member"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>{children}</div>);
}

type MemberDetail = {
  id: string; fullName: string; phone: string;
  whatsappNumber: string | null; dateOfBirth: string;
  address: string; emergencyContact: string; status: string;
  preferredPayoutWeek: number | null; joinedAt: string;
  group: { id: string; contributionAmount: string; maxMembers: number };
  expectedPayout: number;
  payments: Array<{ id: string; reference: string; amount: string; method: string; status: string; paymentDate: string; rejectionReason: string | null }>;
  payouts: Array<{ id: string; expectedAmount: string; actualAmount: string | null; status: string; paidAt: string | null }>;
  notes: Array<{ id: string; note: string; createdAt: string }>;
};

function MemberDetailView({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [m, setM] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/members/detail?id=${memberId}`).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Failed to load"); return data; }).then((d) => setM(d.member)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [memberId, refreshKey]);

  async function toggleActive() {
    if (!m) return;
    const newStatus = m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const verb = newStatus === "ACTIVE" ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${verb} ${m.fullName}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/members/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: m.id, status: newStatus }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); setBusy(false); return; }
      setRefreshKey((k) => k + 1);
    } catch { alert("Network error"); }
    finally { setBusy(false); }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault(); if (!newNote.trim()) return; setSubmittingNote(true);
    try {
      const res = await fetch("/api/admin/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: m?.id, note: newNote }) });
      if (res.ok) { setNewNote(""); setRefreshKey((k) => k + 1); }
    } catch { alert("Failed to save note"); }
    finally { setSubmittingNote(false); }
  }

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading member…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;
  if (!m) return null;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-semibold text-green-700 hover:underline">← Back to Members</button>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl font-bold">{m.fullName.charAt(0).toUpperCase()}</div>
            <div className="text-white">
              <div className="text-2xl font-bold">{m.fullName}</div>
              <div className="text-sm opacity-90">{m.phone}</div>
            </div>
            <div className="ml-auto"><span className={`text-xs px-3 py-1 rounded-full font-bold ${m.status === "ACTIVE" ? "bg-white text-green-700" : "bg-slate-200 text-slate-700"}`}>{m.status}</span></div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div><div className="text-xs text-slate-400 uppercase font-semibold">WhatsApp</div><div className="text-slate-800">{m.whatsappNumber || "—"}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Date of Birth</div><div className="text-slate-800">{new Date(m.dateOfBirth).toLocaleDateString()}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Address</div><div className="text-slate-800">{m.address}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Emergency Contact</div><div className="text-slate-800">{m.emergencyContact}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Joined</div><div className="text-slate-800">{new Date(m.joinedAt).toLocaleDateString()}</div></div>
        </div>
        <div className="px-6 pb-6 flex flex-wrap gap-2">
          <button onClick={() => setShowEdit(true)} disabled={busy} className="text-sm font-semibold px-4 py-2 rounded-xl border-2 disabled:opacity-60" style={{ borderColor: "#16a34a", color: "#15803d" }}>✏️ Edit Member</button>
          <button onClick={() => setShowGroup(true)} disabled={busy} className="text-sm font-semibold px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-700 disabled:opacity-60">🔄 Change Group</button>
          <button onClick={toggleActive} disabled={busy} className={`text-sm font-semibold px-4 py-2 rounded-xl border-2 disabled:opacity-60 ${m.status === "ACTIVE" ? "border-red-200 text-red-600" : "border-green-200 text-green-700"}`}>{busy ? "…" : m.status === "ACTIVE" ? "⏸️ Deactivate" : "▶️ Activate"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="text-xs text-slate-400 uppercase font-semibold mb-1">Group</div><div className="text-2xl font-bold text-slate-800">GH₵{m.group.contributionAmount}</div></div>
        <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="text-xs text-slate-400 uppercase font-semibold mb-1">Preferred Payout Week</div><div className="text-2xl font-bold text-slate-800">{m.preferredPayoutWeek ? `Week ${m.preferredPayoutWeek}` : "—"}</div></div>
        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}><div className="text-xs font-semibold uppercase mb-1" style={{ color: "#15803d" }}>Expected Payout</div><div className="text-2xl font-bold" style={{ color: "#052e16" }}>GH₵{m.expectedPayout.toLocaleString()}</div></div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
        {m.payments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No payments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 border-b border-slate-200">
                <tr><th className="py-2">Reference</th><th className="py-2">Amount</th><th className="py-2">Method</th><th className="py-2">Status</th><th className="py-2">Date</th></tr>
              </thead>
              <tbody>
                {m.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 font-mono text-xs">{p.reference}</td>
                    <td className="py-2 font-semibold">GH₵{p.amount}</td>
                    <td className="py-2 text-xs">{p.method.replace(/_/g, " ")}</td>
                    <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === "VERIFIED" ? "bg-green-100 text-green-700" : p.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span></td>
                    <td className="py-2 text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Payout History</h3>
        {m.payouts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No payouts yet.</div>
        ) : (
          <div className="space-y-2">
            {m.payouts.map((p) => (
              <div key={p.id} className="flex justify-between items-center border-b border-slate-100 py-2">
                <div><div className="text-sm font-semibold">GH₵{p.actualAmount || p.expectedAmount}</div><div className="text-xs text-slate-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "Scheduled"}</div></div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Admin Notes (Private)</h3>
        <form onSubmit={handleAddNote} className="mb-6 flex gap-2">
          <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write a private note..." className="flex-1 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2" />
          <button type="submit" disabled={submittingNote || !newNote.trim()} className="text-white font-semibold px-4 py-2 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submittingNote ? "..." : "Add Note"}</button>
        </form>
        {m.notes.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">No notes yet.</div>
        ) : (
          <div className="space-y-3">
            {m.notes.map((n) => (
              <div key={n.id} className="border-l-4 border-green-500 pl-3 py-1 bg-slate-50 rounded-r-lg">
                <div className="text-sm text-slate-800">{n.note}</div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && m && <EditMemberModal member={m} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); setRefreshKey((k) => k + 1); }} />}
      {showGroup && m && <ChangeGroupModal member={m} onClose={() => setShowGroup(false)} onSuccess={() => { setShowGroup(false); setRefreshKey((k) => k + 1); }} />}
    </div>
  );
}

function EditMemberModal({ member, onClose, onSuccess }: { member: MemberDetail; onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: member.fullName, phone: member.phone, whatsappNumber: member.whatsappNumber || "", dateOfBirth: member.dateOfBirth.substring(0, 10), address: member.address, emergencyContact: member.emergencyContact, preferredPayoutWeek: member.preferredPayoutWeek ? String(member.preferredPayoutWeek) : "" });

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.id, ...form }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Edit Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *"><input type="text" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Phone Number *"><input type="text" required value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="WhatsApp Number"><input type="text" value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Date of Birth *"><input type="date" required value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Emergency Contact *"><input type="text" required value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
            <Field label="Preferred Payout Week"><input type="number" min="1" max="20" value={form.preferredPayoutWeek} onChange={(e) => update("preferredPayoutWeek", e.target.value)} placeholder="1–20" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
          </div>
          <Field label="Address *"><input type="text" required value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" /></Field>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeGroupModal({ member, onClose, onSuccess }: { member: MemberDetail; onClose: () => void; onSuccess: () => void }) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newGroupId, setNewGroupId] = useState("");

  useEffect(() => { fetch("/api/admin/groups").then((r) => r.json()).then((d) => setGroups(d.groups || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!newGroupId) { setError("Please select a new group."); return; }
    if (newGroupId === member.group.id) { setError("This is already the member's current group."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.id, fullName: member.fullName, phone: member.phone, whatsappNumber: member.whatsappNumber, dateOfBirth: member.dateOfBirth, address: member.address, emergencyContact: member.emergencyContact, preferredPayoutWeek: member.preferredPayoutWeek, groupId: newGroupId }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Change Group</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm"><div className="text-slate-500 text-xs">Current group</div><div className="font-bold text-slate-800">GH₵{member.group.contributionAmount}</div></div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Move to group *</label>
            {loading ? (<div className="text-slate-400 text-sm py-2">Loading groups…</div>) : (
              <select required value={newGroupId} onChange={(e) => setNewGroupId(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
                <option value="">— Select new group —</option>
                {groups.filter((g) => g.id !== member.group.id).map((g) => (<option key={g.id} value={g.id} disabled={g.availableSlots <= 0}>GH₵{g.contributionAmount} ({g.availableSlots} slots left){g.availableSlots <= 0 ? " — FULL" : ""}</option>))}
              </select>
            )}
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Moving…" : "Change Group"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== PAYOUTS ====================

type PayoutWeek = {
  weekNumber: number; weekId: string; dueDate: string;
  assignedMember: { id: string; fullName: string; phone: string } | null;
  payout: { id: string; status: string; expectedAmount: number; actualAmount: number | null; paidAt: string | null } | null;
};
type PayoutGroup = {
  id: string; contributionAmount: number; expectedPayout: number; maxMembers: number; memberCount: number;
  members: Array<{ id: string; fullName: string; phone: string }>;
  cycleId: string | null; weeks: PayoutWeek[];
};

function PayoutsView() {
  const [groups, setGroups] = useState<PayoutGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assignWeek, setAssignWeek] = useState<PayoutWeek | null>(null);
  const [markPaidPayout, setMarkPaidPayout] = useState<PayoutWeek | null>(null);
  const [busyWeekId, setBusyWeekId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/payouts").then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Failed to load"); return data; }).then((d) => { setGroups(d.groups || []); if (d.groups && d.groups.length > 0 && !selectedGroupId) setSelectedGroupId(d.groups[0].id); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleUnassign(week: PayoutWeek) {
    if (!week.assignedMember) return;
    if (!confirm(`Remove ${week.assignedMember.fullName} from Week ${week.weekNumber}?`)) return;
    setBusyWeekId(week.weekId);
    try {
      const res = await fetch("/api/admin/payouts/unassign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekId: week.weekId }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); setBusyWeekId(null); return; }
      setRefreshKey((k) => k + 1);
    } catch { alert("Network error"); } finally { setBusyWeekId(null); }
  }

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading payouts…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const assignedMemberIds = selectedGroup ? selectedGroup.weeks.filter((w) => w.assignedMember).map((w) => w.assignedMember!.id) : [];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Payout Rotation</h2><p className="text-sm text-slate-500">Assign each member to one payout week per cycle. Members never see which week is theirs.</p></div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <label className="text-sm font-semibold text-slate-700">Select group</label>
        <select value={selectedGroupId || ""} onChange={(e) => setSelectedGroupId(e.target.value)} className="mt-1 w-full sm:w-72 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
          {groups.map((g) => (<option key={g.id} value={g.id}>GH₵{g.contributionAmount} group ({g.memberCount}/{g.maxMembers} members)</option>))}
        </select>
      </div>

      {selectedGroup && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="text-xs text-slate-400 uppercase font-semibold mb-1">Group</div><div className="text-2xl font-bold text-slate-800">GH₵{selectedGroup.contributionAmount}</div></div>
            <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="text-xs text-slate-400 uppercase font-semibold mb-1">Members</div><div className="text-2xl font-bold text-slate-800">{selectedGroup.memberCount} / {selectedGroup.maxMembers}</div></div>
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}><div className="text-xs font-semibold uppercase mb-1" style={{ color: "#15803d" }}>Payout per week</div><div className="text-2xl font-bold" style={{ color: "#052e16" }}>GH₵{selectedGroup.expectedPayout.toLocaleString()}</div></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">20-Week Schedule</h3><p className="text-xs text-slate-500 mt-1">{assignedMemberIds.length} of 20 weeks assigned</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Week</th><th className="px-4 py-3 font-medium">Due Date</th><th className="px-4 py-3 font-medium">Assigned Member</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Action</th></tr>
                </thead>
                <tbody className="text-slate-700">
                  {selectedGroup.weeks.map((w) => {
                    const status = w.payout?.status || "UNASSIGNED";
                    return (
                      <tr key={w.weekId} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold">Week {w.weekNumber}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(w.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {w.assignedMember ? (
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#16a34a" }}>{w.assignedMember.fullName.charAt(0).toUpperCase()}</span>
                              <span className="font-semibold text-slate-800">{w.assignedMember.fullName}</span>
                              <span className="text-xs text-slate-500">{w.assignedMember.phone}</span>
                            </div>
                          ) : (<span className="text-slate-400 text-xs italic">— Unassigned —</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {status === "PAID" && <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700">✓ Paid</span>}
                          {status === "SCHEDULED" && <span className="text-xs px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">Scheduled</span>}
                          {status === "UNASSIGNED" && <span className="text-xs px-2 py-1 rounded-full font-semibold bg-slate-200 text-slate-600">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!w.assignedMember && (<button onClick={() => setAssignWeek(w)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#16a34a" }}>Assign</button>)}
                          {w.assignedMember && w.payout?.status === "SCHEDULED" && (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setMarkPaidPayout(w)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#16a34a" }}>Mark as Paid</button>
                              <button onClick={() => handleUnassign(w)} disabled={busyWeekId === w.weekId} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 disabled:opacity-60">Unassign</button>
                            </div>
                          )}
                          {w.assignedMember && w.payout?.status === "PAID" && (<span className="text-xs text-slate-400">Completed</span>)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {assignWeek && selectedGroup && <AssignModal week={assignWeek} group={selectedGroup} alreadyAssignedIds={assignedMemberIds} onClose={() => setAssignWeek(null)} onSuccess={() => { setAssignWeek(null); setRefreshKey((k) => k + 1); }} />}
      {markPaidPayout && <MarkPaidModal week={markPaidPayout} onClose={() => setMarkPaidPayout(null)} onSuccess={() => { setMarkPaidPayout(null); setRefreshKey((k) => k + 1); }} />}
    </div>
  );
}

function AssignModal({ week, group, alreadyAssignedIds, onClose, onSuccess }: { week: PayoutWeek; group: PayoutGroup; alreadyAssignedIds: string[]; onClose: () => void; onSuccess: () => void }) {
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const available = group.members.filter((m) => !alreadyAssignedIds.includes(m.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!memberId) { setError("Please select a member."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payouts/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekId: week.weekId, memberId }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to assign"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Assign Week {week.weekNumber}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm"><div className="text-slate-500 text-xs">Payout week due date</div><div className="font-bold text-slate-800">{new Date(week.dueDate).toLocaleDateString()}</div><div className="text-slate-500 text-xs mt-2">Expected payout</div><div className="font-bold text-slate-800">GH₵{group.expectedPayout.toLocaleString()}</div></div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Select member *</label>
            {available.length === 0 ? (<div className="text-sm text-red-600 mt-2">All members in this group are already assigned.</div>) : (
              <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
                <option value="">— Choose a member —</option>
                {available.map((m) => (<option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>))}
              </select>
            )}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">ⓘ The member will <strong>not</strong> see this assignment. Only you can see it.</div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting || available.length === 0} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Assigning…" : "Assign"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkPaidModal({ week, onClose, onSuccess }: { week: PayoutWeek; onClose: () => void; onSuccess: () => void }) {
  const expected = week.payout?.expectedAmount || 0;
  const [amount, setAmount] = useState(String(expected));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payouts/mark-paid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutId: week.payout?.id, actualAmount: amt }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to mark paid"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Mark Payout as Paid</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm"><div className="text-xs text-green-700">Recipient</div><div className="font-bold text-slate-800">{week.assignedMember?.fullName}</div><div className="text-xs text-slate-500 mt-1">Week {week.weekNumber} • {week.assignedMember?.phone}</div></div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Amount sent (GH₵) *</label>
            <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" />
            <div className="text-xs text-slate-500 mt-1">Expected: GH₵{expected.toLocaleString()}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">ⓘ Only click <strong>Mark as Paid</strong> after you have actually sent the money. The member will be notified immediately.</div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Confirming…" : "Confirm Paid"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComingSoon({ view }: { view: string }) {
  return (<div className="bg-white rounded-2xl p-12 text-center shadow-sm"><div className="text-5xl mb-3">🚧</div><h3 className="font-bold text-slate-800 mb-1 capitalize">{view}</h3><p className="text-sm text-slate-500">This section is coming in the next stage.</p></div>);
}
