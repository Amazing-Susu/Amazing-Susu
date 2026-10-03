"use client";
import { useState, useEffect } from "react";

type MemberInfo = {
  id: string; fullName: string; phone: string;
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

  if (checking) return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}><div className="text-slate-500">Loading…</div></div>;
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
          <div><label className="text-sm font-semibold text-slate-700">Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          <div><label className="text-sm font-semibold text-slate-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

function MemberDashboard({ member, weekly, payments, payoutStatus, onRefresh, onLogout }: {
  member: MemberInfo; weekly: WeeklyRow[]; payments: PaymentRow[]; payoutStatus: PayoutStatus | null;
  onRefresh: () => void; onLogout: () => void;
}) {
  const [showPay, setShowPay] = useState(false);
  const currentWeek = weekly.find((w) => w.weekNumber === member.currentWeekNumber);
  const totalPaid = weekly.reduce((s, w) => s + w.verified, 0);
  const weeksPaidCount = weekly.filter((w) => w.status === "FULL").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="text-white px-5 pt-5 pb-20 rounded-b-3xl" style={{ backgroundColor: "#16a34a" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs opacity-90">Welcome back</div>
            <div className="text-xl font-bold">{member.fullName}</div>
          </div>
          <button onClick={onLogout} className="text-xs opacity-90 hover:opacity-100">Sign Out</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 -mt-16 space-y-4 pb-10">
        {currentWeek && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">This Week (Week {currentWeek.weekNumber})</div>
                <div className="text-xs text-slate-400 mt-0.5">Due {new Date(currentWeek.dueDate).toLocaleDateString()}</div>
              </div>
              <StatusBadge status={currentWeek.status} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center"><div className="text-xs text-slate-500">Expected</div><div className="text-lg font-bold text-slate-800">GH₵{currentWeek.expected}</div></div>
              <div className="text-center"><div className="text-xs text-slate-500">Verified</div><div className="text-lg font-bold" style={{ color: "#16a34a" }}>GH₵{currentWeek.verified}</div></div>
              <div className="text-center"><div className="text-xs text-slate-500">Pending</div><div className="text-lg font-bold text-yellow-600">GH₵{currentWeek.pending}</div></div>
            </div>
            {currentWeek.status !== "FULL" && (
              <button onClick={() => setShowPay(true)} className="w-full mt-4 text-white font-semibold py-3 rounded-xl" style={{ backgroundColor: "#16a34a" }}>
                {currentWeek.verified > 0 || currentWeek.pending > 0 ? "Add Another Payment" : "Pay This Week"}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-xs text-slate-500">Weeks Paid</div><div className="text-2xl font-bold text-slate-800">{weeksPaidCount}<span className="text-sm text-slate-400"> / 20</span></div></div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><div className="text-xs text-slate-500">Total Contributed</div><div className="text-2xl font-bold text-slate-800">GH₵{totalPaid.toLocaleString()}</div></div>
        </div>

        {/* Payout card with real status */}
        {payoutStatus && (
          <div
            className="rounded-2xl p-5 border"
            style={
              payoutStatus.state === "RECEIVED"
                ? { backgroundColor: "#dcfce7", borderColor: "#86efac" }
                : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }
            }
          >
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#15803d" }}>
              {payoutStatus.state === "RECEIVED" ? "✓ Payout Received" : "Your Expected Payout"}
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: "#052e16" }}>
              GH₵{payoutStatus.amount.toLocaleString()}
            </div>
            <div className="text-xs mt-2" style={{ color: "#15803d" }}>
              {payoutStatus.state === "RECEIVED" && payoutStatus.paidAt
                ? `Received on ${new Date(payoutStatus.paidAt).toLocaleDateString()}`
                : payoutStatus.state === "SCHEDULED"
                ? "Scheduled — waiting for admin to complete"
                : "Pending"}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">Weekly Progress</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {weekly.map((w) => (
              <div key={w.weekNumber} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div><div className="text-sm font-semibold text-slate-800">Week {w.weekNumber}</div><div className="text-xs text-slate-500">GH₵{w.verified} / GH₵{w.expected}</div></div>
                <StatusBadge status={w.status} small />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">Recent Payments</h3>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No payments yet. Submit your first payment above.</div>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 15).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">GH₵{p.amount}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.reference}</div>
                    <div className="text-xs text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</div>
                    {p.rejectionReason && <div className="text-xs text-red-600 mt-1">Reason: {p.rejectionReason}</div>}
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPay && currentWeek && <PaymentModal expected={currentWeek.expected} onClose={() => setShowPay(false)} onSuccess={() => { setShowPay(false); onRefresh(); }} />}
    </div>
  );
}

function StatusBadge({ status, small }: { status: "NOT_PAID" | "PARTIAL" | "FULL"; small?: boolean }) {
  const base = small ? "text-xs px-2 py-0.5" : "text-xs px-3 py-1";
  if (status === "FULL") return <span className={`${base} rounded-full font-semibold bg-green-100 text-green-700`}>✓ Fully Paid</span>;
  if (status === "PARTIAL") return <span className={`${base} rounded-full font-semibold bg-yellow-100 text-yellow-700`}>⏳ Partial</span>;
  return <span className={`${base} rounded-full font-semibold bg-slate-200 text-slate-600`}>Not Paid</span>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "VERIFIED") return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700">Verified</span>;
  if (status === "REJECTED") return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-red-100 text-red-700">Rejected</span>;
  return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">Pending</span>;
}

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Submit Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleFirstSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Amount (GH₵)</label>
            <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Expected: ${expected}`} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" />
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 text-white font-semibold py-3 rounded-xl disabled:opacity-60" style={{ backgroundColor: "#16a34a" }}>{submitting ? "Submitting…" : "Submit Payment"}</button>
          </div>
        </form>
      </div>

      {warning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold text-slate-800 mb-2">Amount Below Expected</h3>
            <p className="text-sm text-slate-600 mb-5">Your group contribution is <strong>GH₵{expected}</strong>.<br />You entered <strong>GH₵{amount}</strong>.<br /><br />Are you sure you want to submit this payment?</p>
            <div className="flex gap-3">
              <button onClick={() => setWarning(false)} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl">Cancel</button>
              <button onClick={submit} className="flex-1 text-white font-semibold py-3 rounded-xl" style={{ backgroundColor: "#16a34a" }}>Submit Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
