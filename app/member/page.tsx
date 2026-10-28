"use client";
import { useState, useEffect } from "react";

type MemberInfo = {
  id: string; fullName: string; phone: string; joinedAt: string;
  groupAmount: number; expectedPayout: number;
  currentWeekNumber: number; cycleId: string | null;
};
type WeeklyRow = { weekNumber: number; weekId: string; dueDate: string; expected: number; verified: number; pending: number; status: "NOT_PAID" | "PARTIAL" | "FULL"; };
type PaymentRow = { id: string; reference: string; amount: number; method: string; status: string; paymentDate: string; rejectionReason: string | null; };
type PayoutStatus = { state: "PENDING" | "SCHEDULED" | "RECEIVED"; amount: number; paidAt?: string | null; };

export default function MemberPage() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.member) {
          setMember(d.member);
          setWeekly(d.weeklyStatus || []);
          setPayments(d.payments || []);
          setPayoutStatus(d.payoutStatus || null);
        }
      })
      .finally(() => setChecking(false));
  }, [refreshKey]);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-500">Loading your dashboard…</div></div>;
  if (!member) return <MemberLogin onSuccess={() => setRefreshKey((k) => k + 1)} />;

  return (
    <MemberDashboard
      member={member}
      weekly={weekly}
      payments={payments}
      payoutStatus={payoutStatus}
      onRefresh={() => setRefreshKey((k) => k + 1)}
      onLogout={async () => { await fetch("/api/member/logout", { method: "POST" }); setMember(null); }}
    />
  );
}

// ==================== LOGIN ====================

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
    } catch { setError("Network error. Please try again."); setLoading(false); }
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
          <div><label className="text-sm font-semibold text-slate-700">Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0551234567" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          <div><label className="text-sm font-semibold text-slate-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

// ==================== DASHBOARD ====================

function MemberDashboard({ member, weekly, payments, payoutStatus, onRefresh, onLogout }: {
  member: MemberInfo; weekly: WeeklyRow[]; payments: PaymentRow[]; payoutStatus: PayoutStatus | null;
  onRefresh: () => void; onLogout: () => void;
}) {
  const [showPay, setShowPay] = useState(false);
  const currentWeek = weekly.find((w) => w.weekNumber === member.currentWeekNumber);
  const totalPaid = weekly.reduce((s, w) => s + w.verified, 0);
  const weeksPaidCount = weekly.filter((w) => w.status === "FULL").length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <header className="text-white px-5 pt-8 pb-24 rounded-b-[2.5rem]" style={{ backgroundColor: "#16a34a" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90 mb-1">Welcome back 👋</div>
            <div className="text-2xl font-bold">{member.fullName}</div>
          </div>
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg text-xs font-semibold">Sign Out</button>
        </div>
      </header>

      {/* PROFILE CARD */}
      <div className="max-w-md mx-auto px-4 -mt-16 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
            {member.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg leading-tight">{member.fullName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{member.phone}</div>
            <div className="text-xs text-slate-400 mt-1">Joined: {new Date(member.joinedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* 3 STAT TILES */}
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

        {/* PAYOUT CARD */}
        {payoutStatus && (
          <div
            className="rounded-2xl p-5 border shadow-sm"
            style={
              payoutStatus.state === "RECEIVED"
                ? { backgroundColor: "#dcfce7", borderColor: "#86efac" }
                : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }
            }
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#15803d" }}>
                  {payoutStatus.state === "RECEIVED" ? "✓ Payout Received" : "Your Expected Payout"}
                </div>
                <div className="text-3xl font-bold mt-1" style={{ color: "#052e16" }}>
                  GH₵{payoutStatus.amount.toLocaleString()}
                </div>
                <div className="text-xs mt-2 font-medium" style={{ color: "#15803d" }}>
                  {payoutStatus.state === "RECEIVED" && payoutStatus.paidAt
                    ? `Received on ${new Date(payoutStatus.paidAt).toLocaleDateString()}`
                    : payoutStatus.state === "SCHEDULED"
                    ? "Scheduled — awaiting admin to complete"
                    : "Pending — complete your weekly contributions"}
                </div>
              </div>
              <div className="text-3xl">
                {payoutStatus.state === "RECEIVED" ? "🎉" : "⏳"}
              </div>
            </div>
          </div>
        )}

        {/* CURRENT WEEK ACTION */}
        {currentWeek && currentWeek.status !== "FULL" && (
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Week {currentWeek.weekNumber} Action</div>
              <div className="text-sm font-bold text-slate-800 mt-1">GH₵{currentWeek.verified} / GH₵{currentWeek.expected}</div>
              {currentWeek.pending > 0 && <div className="text-xs text-yellow-600 mt-1 font-medium">GH₵{currentWeek.pending} awaiting verification</div>}
            </div>
            <button onClick={() => setShowPay(true)} className="text-white font-bold px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: "#16a34a" }}>
              Pay Now
            </button>
          </div>
        )}

        {/* PAYMENT HISTORY */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-4">
          <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
          {payments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No payments yet. Submit your first payment above.</div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg">🧾</div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">GH₵{p.amount}</div>
                      <div className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()} • {p.reference}</div>
                      {p.rejectionReason && <div className="text-xs text-red-600 mt-1">Reason: {p.rejectionReason}</div>}
                    </div>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
              {payments.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-green-700 font-semibold cursor-pointer">View all payments →</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* WEEKLY PROGRESS (20 WEEKS) */}
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

      {showPay && currentWeek && (
        <PaymentModal expected={currentWeek.expected} onClose={() => setShowPay(false)} onSuccess={() => { setShowPay(false); onRefresh(); }} />
      )}
    </div>
  );
}

// ==================== BADGES ====================

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

// ==================== PAYMENT MODAL ====================

const PAYMENT_METHODS = [
  { value: "MTN_MOMO", label: "MTN Mobile Money" },
  { value: "TELECEL_CASH", label: "Telecel Cash" },
  { value: "AIRTELTIGO_MONEY", label: "AirtelTigo Money" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

function PaymentModal({ expected, onClose, onSuccess }: { expected: number; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN_MOMO");
  const [transactionId, setTransactionId] = useState("");
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFirstSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount."); return; }
    if (amt < expected) { setWarning(true); return; }
    submit();
  }

  async function submit() {
    setWarning(false); setSubmitting(true);
    try {
      const res = await fetch("/api/member/payments/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount), paymentMethod: method, transactionId }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit"); setSubmitting(false); return; }
      onSuccess();
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Submit Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleFirstSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Amount (GH₵)</label>
            <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Expected: ${expected}`} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 text-lg font-bold" />
            <div className="text-xs text-slate-500 mt-1">Your group expects GH₵{expected} per week.</div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 bg-white">
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Transaction / Reference (optional)</label>
            <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. Momo transaction ID" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div className="pt-2">
            <button type="submit" disabled={submitting} className="w-full text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-60 text-lg" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Submitting…" : "Submit Payment"}</button>
            <button type="button" onClick={onClose} className="w-full mt-2 text-slate-500 font-semibold py-2 rounded-xl">Cancel</button>
          </div>
        </form>
      </div>

      {warning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Amount Below Expected</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">Your group contribution is <strong>GH₵{expected}</strong>.<br />You entered <strong>GH₵{amount}</strong>.<br /><br />Are you sure you want to submit this payment?</p>
            <div className="space-y-2">
              <button onClick={submit} className="w-full text-white font-bold py-3 rounded-xl" style={{ backgroundColor: "#16a34a" }}>Yes, Submit Anyway</button>
              <button onClick={() => setWarning(false)} className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
