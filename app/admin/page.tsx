"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
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

  function handleNavigate(view: string) {
    if (view !== "members") setSelectedMemberId(null);
    setCurrentView(view);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}>
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
      onNavigate={handleNavigate}
      onLogout={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setLoggedIn(false);
        setCurrentView("dashboard");
        setSelectedMemberId(null);
      }}
    >
      {currentView === "dashboard" && <DashboardView adminName={adminName} />}
      {currentView === "members" && !selectedMemberId && (
        <MembersView onViewMember={setSelectedMemberId} />
      )}
      {currentView === "members" && selectedMemberId && (
        <MemberDetailView
          memberId={selectedMemberId}
          onBack={() => setSelectedMemberId(null)}
        />
      )}
      {currentView !== "dashboard" && currentView !== "members" && (
        <ComingSoon view={currentView} />
      )}
    </AdminShell>
  );
}

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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}>
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
            <label className="text-sm font-semibold text-slate-700">Email or Phone Number</label>
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminShell({
  adminName, currentView, onNavigate, onLogout, children,
}: {
  adminName: string;
  currentView: string;
  onNavigate: (v: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "members", icon: "👥", label: "Members" },
    { id: "groups", icon: "📁", label: "Groups" },
    { id: "payments", icon: "💳", label: "Payments" },
    { id: "payouts", icon: "💰", label: "Payouts" },
    { id: "approvals", icon: "✅", label: "Approvals" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden md:flex flex-col w-60 text-white" style={{ backgroundColor: "#0a3d2a" }}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: "#16a34a" }}>🌱</div>
            <div>
              <div className="font-bold text-lg leading-tight">Amazing<span style={{ color: "#4ade80" }}>Susu</span></div>
              <div className="text-[10px] opacity-70">Save Together • Grow Together</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = item.id === currentView;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-left" style={active ? { backgroundColor: "#16a34a" } : undefined}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={onLogout} className="w-full text-xs opacity-70 hover:opacity-100 text-left">Sign Out →</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <span className="font-bold text-lg text-slate-800">
            {navItems.find((n) => n.id === currentView)?.label || "Dashboard"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: "#16a34a" }}>
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700">{adminName}</span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function DashboardView({ adminName }: { adminName: string }) {
  const kpis = [
    { label: "Total Members", value: "0", sub: "Start adding members", icon: "👥", color: "linear-gradient(135deg, #16a34a, #15803d)" },
    { label: "Total Contributions (GH₵)", value: "0.00", sub: "No payments yet", icon: "💵", color: "linear-gradient(135deg, #2563eb, #1d4ed8)" },
    { label: "Total Weeks Paid", value: "0", sub: "Awaiting first payment", icon: "📅", color: "linear-gradient(135deg, #7c3aed, #6d28d9)" },
    { label: "Active Groups", value: "9", sub: "All tiers ready", icon: "📊", color: "linear-gradient(135deg, #ea580c, #c2410c)" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">👋 Welcome, {adminName}</h2>
        <p className="text-sm text-slate-500">Numbers below will fill in as you add members and receive payments.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5 text-white relative overflow-hidden shadow" style={{ background: kpi.color }}>
            <div className="absolute right-3 top-3 text-6xl opacity-20">{kpi.icon}</div>
            <div className="text-sm opacity-90 mb-1">{kpi.label}</div>
            <div className="text-3xl font-bold">{kpi.value}</div>
            <div className="text-xs mt-2 opacity-90">{kpi.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Recent Payments</h3>
        <div className="text-center py-12 text-slate-400 text-sm">No payments yet.<br />Once members start submitting, they'll appear here.</div>
      </div>
    </div>
  );
}

type MemberRow = { id: string; fullName: string; phone: string; groupAmount: string; status: string; joinedAt: string };

function MembersView({ onViewMember }: { onViewMember: (id: string) => void }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/members")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        return data;
      })
      .then((d) => setMembers(d.members || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading members…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Members</h2>
            <p className="text-sm text-slate-500">{members.length} member{members.length === 1 ? "" : "s"} in your Susu system</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="text-white font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#16a34a" }}>
            + Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">👥</div>
            <h3 className="font-bold text-slate-800 mb-1">No members yet</h3>
            <p className="text-sm text-slate-500 mb-6">Members you add will appear here.</p>
            <button onClick={() => setShowAdd(true)} className="text-white font-semibold px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#16a34a" }}>
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
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#16a34a" }}>
                            {m.fullName.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold">{m.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                      <td className="px-4 py-3">GH₵{m.groupAmount}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(m.joinedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onViewMember(m.id)} className="text-xs font-semibold text-green-700 hover:underline">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

type GroupOption = { id: string; contributionAmount: string; maxMembers: number; currentMembers: number; availableSlots: number };

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsappNumber: "",
    ghanaCardNumber: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    password: "",
    groupId: "",
    preferredPayoutWeek: "",
  });

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create member");
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
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
            <Field label="Full Name *">
              <input type="text" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
            <Field label="Phone Number *">
              <input type="text" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0551234567" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
            <Field label="WhatsApp Number">
              <input type="text" value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
            <Field label="Ghana Card Number *">
              <input type="text" required value={form.ghanaCardNumber} onChange={(e) => update("ghanaCardNumber", e.target.value)} placeholder="GHA-123456789-0" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
            <Field label="Date of Birth *">
              <input type="date" required value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
            <Field label="Emergency Contact *">
              <input type="text" required value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
          </div>

          <Field label="Address *">
            <input type="text" required value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contribution Group *">
              {loadingGroups ? (
                <div className="text-slate-400 text-sm py-2">Loading groups…</div>
              ) : (
                <select required value={form.groupId} onChange={(e) => update("groupId", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 bg-white">
                  <option value="">— Select group —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} disabled={g.availableSlots <= 0}>
                      GH₵{g.contributionAmount} ({g.availableSlots} slots left){g.availableSlots <= 0 ? " — FULL" : ""}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Preferred Payout Week (optional)">
              <input type="number" min="1" max="20" value={form.preferredPayoutWeek} onChange={(e) => update("preferredPayoutWeek", e.target.value)} placeholder="1–20" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
            </Field>
          </div>

          <Field label="Login Password * (for the member)">
            <input type="text" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 6 characters" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2" />
          </Field>

          {selectedGroup && (
            <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="font-semibold mb-1" style={{ color: "#15803d" }}>Preview</div>
              <div className="text-slate-700">
                Weekly contribution: <strong>GH₵{selectedGroup.contributionAmount}</strong><br />
                Expected payout: <strong>GH₵{(20 * Number(selectedGroup.contributionAmount) - 50).toLocaleString()}</strong>
                <span className="text-xs text-slate-500"> (20 × GH₵{selectedGroup.contributionAmount} − GH₵50 fee)</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>
              {submitting ? "Creating…" : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

type MemberDetail = {
  id: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  ghanaCardNumber: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  status: string;
  preferredPayoutWeek: number | null;
  joinedAt: string;
  group: { id: string; contributionAmount: string; maxMembers: number };
  expectedPayout: number;
  payments: Array<{
    id: string; reference: string; amount: string; method: string;
    status: string; paymentDate: string; rejectionReason: string | null;
  }>;
  payouts: Array<{
    id: string; expectedAmount: string; actualAmount: string | null;
    status: string; paidAt: string | null;
  }>;
  notes: Array<{ id: string; note: string; createdAt: string }>;
};

function MemberDetailView({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [m, setM] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/members/detail?id=${memberId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load");
        return data;
      })
      .then((d) => setM(d.member))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <div className="bg-white rounded-2xl p-12 text-center text-slate-400">Loading member…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">{error}</div>;
  if (!m) return null;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-semibold text-green-700 hover:underline">← Back to Members</button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center text-2xl font-bold">
              {m.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">{m.fullName}</div>
              <div className="text-sm opacity-90">{m.phone}</div>
            </div>
            <div className="ml-auto">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${m.status === "ACTIVE" ? "bg-white text-green-700" : "bg-slate-200 text-slate-700"}`}>{m.status}</span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div><div className="text-xs text-slate-400 uppercase font-semibold">WhatsApp</div><div className="text-slate-800">{m.whatsappNumber || "—"}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Ghana Card</div><div className="text-slate-800">{m.ghanaCardNumber}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Date of Birth</div><div className="text-slate-800">{new Date(m.dateOfBirth).toLocaleDateString()}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Address</div><div className="text-slate-800">{m.address}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Emergency Contact</div><div className="text-slate-800">{m.emergencyContact}</div></div>
          <div><div className="text-xs text-slate-400 uppercase font-semibold">Joined</div><div className="text-slate-800">{new Date(m.joinedAt).toLocaleDateString()}</div></div>
        </div>

        <div className="px-6 pb-6 flex flex-wrap gap-2">
          <button className="text-sm font-semibold px-4 py-2 rounded-xl border-2" style={{ borderColor: "#16a34a", color: "#15803d" }}>✏️ Edit Member</button>
          <button className="text-sm font-semibold px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-700">🔄 Change Group</button>
          <button className="text-sm font-semibold px-4 py-2 rounded-xl border-2 border-red-200 text-red-600">⏸️ Deactivate</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Group</div>
          <div className="text-2xl font-bold text-slate-800">GH₵{m.group.contributionAmount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Preferred Payout Week</div>
          <div className="text-2xl font-bold text-slate-800">{m.preferredPayoutWeek ? `Week ${m.preferredPayoutWeek}` : "—"}</div>
        </div>
        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "#f0fdf4" }}>
          <div className="text-xs font-semibold uppercase mb-1" style={{ color: "#15803d" }}>Expected Payout</div>
          <div className="text-2xl font-bold" style={{ color: "#052e16" }}>GH₵{m.expectedPayout.toLocaleString()}</div>
        </div>
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
                <div>
                  <div className="text-sm font-semibold">GH₵{p.actualAmount || p.expectedAmount}</div>
                  <div className="text-xs text-slate-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "Scheduled"}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Admin Notes</h3>
        <div className="text-center py-8 text-slate-400 text-sm">No notes yet. Notes feature coming soon.</div>
      </div>
    </div>
  );
}

function ComingSoon({ view }: { view: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
      <div className="text-5xl mb-3">🚧</div>
      <h3 className="font-bold text-slate-800 mb-1 capitalize">{view}</h3>
      <p className="text-sm text-slate-500">This section is coming in the next stage.</p>
    </div>
  );
}
