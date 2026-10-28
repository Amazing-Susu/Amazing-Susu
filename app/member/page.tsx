"use client";
import { useState, useEffect } from "react";

type MemberInfo = { id: string; fullName: string; phone: string; joinedAt: string; groupAmount: number; expectedPayout: number; currentWeekNumber: number; cycleId: string | null; };
type WeeklyRow = { weekNumber: number; weekId: string; dueDate: string; expected: number; verified: number; pending: number; status: "NOT_PAID" | "PARTIAL" | "FULL"; };
type PaymentRow = { id: string; reference: string; amount: number; method: string; status: string; paymentDate: string; rejectionReason: string | null; };
type PayoutStatus = { state: "PENDING" | "SCHEDULED" | "RECEIVED"; amount: number; paidAt?: string | null; };
type NotificationRow = { id: string; title: string; message: string; readAt: string | null; createdAt: string; };

export default function MemberPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [checking, setChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/member/me").then((r) => (r.ok ? r.json() : null)).then((d) => {
        if (d?.member) {
          setMember(d.member); setWeekly(d.weeklyStatus || []); setPayments(d.payments || []); setPayoutStatus(d.payoutStatus || null);
        }
      }).finally(() => setChecking(false));
    fetch("/api/member/notifications").then((r) => (r.ok ? r.json() : { notifications: [] })).then((d) => setNotifications(d.notifications || [])).catch(() => {});
  }, [refreshKey]);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-500">Loading…</div></div>;
  if (!member) return <MemberLogin onSuccess={() => setRefreshKey((k) => k + 1)} />;

  return (
    <MemberDashboard
      member={member} weekly={weekly} payments={payments} payoutStatus={payoutStatus} notifications={notifications}
      onRefresh={() => setRefreshKey((k) => k + 1)}
      onLogout={async () => { await fetch("/api/member/logout", { method: "POST" }); setMember(null); }}
    />
  );
}

function MemberLogin({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/member/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      onSuccess();
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a3d2a" }}>Amazing <span style={{ color: "#16a34a" }}>Susu</span></h1>
          <p className="text-sm text-slate-500 mt-1">Member Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-sm font-semibold text-slate-700">Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          <div><label className="text-sm font-semibold text-slate-700">Password / PIN</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

function MemberDashboard({ member, weekly, payments, payoutStatus, notifications, onRefresh, onLogout }: {
  member: MemberInfo; weekly: WeeklyRow[]; payments: PaymentRow[]; payoutStatus: PayoutStatus | null; notifications: NotificationRow[];
  onRefresh: () => void; onLogout: () => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const currentWeek = weekly.find((w) => w.weekNumber === member.currentWeekNumber);
  const totalPaid = weekly.reduce((s, w) => s + w.verified, 0);
  const weeksPaidCount = weekly.filter((w) => w.status === "FULL").length;
  const unreadCount = notifications.filter(n => !n.readAt).length;

  async function openNotifications() {
    setShowNotifications(true);
    if (unreadCount > 0) { await fetch("/api/member/notifications", { method: "POST" }); onRefresh(); }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="text-white px-5 pt-8 pb-24 rounded-b-[2.5rem]" style={{ backgroundColor: "#16a34a" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90 mb-1">Welcome back 👋</div>
            <div className="text-2xl font-bold">{member.fullName}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openNotifications} className="relative bg-white/20 hover:bg-white/30 transition p-2 rounded-xl">
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-green-600">{unreadCount}</span>}
            </button>
            <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 transition px-3 py-2 rounded-xl text-xs font-semibold">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-16 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>{member.fullName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="font-bold text-slate-800 text-lg leading-tight">{member.fullName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{member.phone}</div>
            <div className="text-xs text-slate-400 mt-1">Joined: {new Date(member.joinedAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <div className="text-xl mb-1">📅</div>
            <div className="text-lg font-bold text-slate-800">{weeksPaidCount}<span className="text-xs text-slate-400"> / 20</span></div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Weeks Paid</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <div className="text-xl mb-1">💵</div>
            <div className="text-lg font-bold text-slate-800">GH₵{totalPaid.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Contributed</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
            <div className="text-xl mb-1">👥</div>
            <div className="text-lg font-bold text-slate-800">GH₵{member.groupAmount}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Group Tier</div>
          </div>
        </div>

        {payoutStatus && (
          <div className="rounded-2xl p-5 border shadow-sm" style={payoutStatus.state === "RECEIVED" ? { backgroundColor: "#dcfce7", borderColor: "#86efac" } : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#15803d" }}>{payoutStatus.state === "RECEIVED" ? "✓ Payout Received" : "Your Expected Payout"}</div>
                <div className="text-3xl font-bold mt-1" style={{ color: "#052e16" }}>GH₵{payoutStatus.amount.toLocaleString()}</div>
                <div className="text-xs mt-2 font-medium" style={{ color: "#15803d" }}>
                  {payoutStatus.state === "RECEIVED" && payoutStatus.paidAt ? `Received on ${new Date(payoutStatus.paidAt).toLocaleDateString()}` : payoutStatus.state === "SCHEDULED" ? "Scheduled — awaiting admin" : "Pending — complete your contributions"}
                </div>
              </div>
              <div className="text-3xl">{payoutStatus.state === "RECEIVED" ? "🎉" : "⏳"}</div>
            </div>
          </div>
        )}

        {/* NO PAY BUTTON HERE ANYMORE. JUST A STATUS VIEW. */}
        {currentWeek && (
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Week {currentWeek.weekNumber} Status</div>
              <div className="text-sm font-bold text-slate-800 mt-1">GH₵{currentWeek.verified} / GH₵{currentWeek.expected}</div>
            </div>
            <StatusBadge status={currentWeek.status} />
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-4">
          <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
          {payments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg">🧾</div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">GH₵{p.amount}</div>
                      <div className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()} • {p.reference}</div>
                    </div>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-4">
          <h3 className="font-bold text-slate-800 mb-4">20-Week Progress</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {weekly.map((w) => (
              <div key={w.weekNumber} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Week {w.weekNumber}</div>
                  <div className="text-xs text-slate-500">GH₵{w.verified} / GH₵{w.expected}</div>
                </div>
                <StatusBadge status={w.status} small />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNotifications && <NotificationModal notifications={notifications} onClose={() => setShowNotifications(false)} />}
    </div>
  );
}

function StatusBadge({ status, small }: { status: "NOT_PAID" | "PARTIAL" | "FULL"; small?: boolean }) {
  const base = small ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1";
  if (status === "FULL") return <span className={`${base} rounded-full font-bold bg-green-100 text-green-700`}>✓ Paid</span>;
  if (status === "PARTIAL") return <span className={`${base} rounded-full font-bold bg-yellow-100 text-yellow-700`}>⏳ Partial</span>;
  return <span className={`${base} rounded-full font-bold bg-slate-100 text-slate-500`}>Unpaid</span>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "VERIFIED") return <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">Verified</span>;
  if (status === "REJECTED") return <span className="text-xs px-2 py-1 rounded-full font-bold bg-red-100 text-red-700">Rejected</span>;
  return <span className="text-xs px-2 py-1 rounded-full font-bold bg-yellow-100 text-yellow-700">Pending</span>;
}

function NotificationModal({ notifications, onClose }: { notifications: NotificationRow[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><div className="text-4xl mb-2">📭</div><p className="text-sm">No notifications yet.</p></div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`p-4 rounded-xl border ${n.readAt ? 'bg-white border-slate-100' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-slate-800 text-sm">{n.title}</div>
                  {!n.readAt && <span className="w-2 h-2 rounded-full bg-green-500 mt-1"></span>}
                </div>
                <div className="text-sm text-slate-600 leading-snug">{n.message}</div>
                <div className="text-[10px] text-slate-400 mt-2 uppercase font-semibold">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
