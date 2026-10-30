"use client";
import { useState, useEffect, useRef } from "react";
import InstallBanner from "./InstallBanner";

type MemberInfo = { id: string; fullName: string; phone: string; joinedAt: string; groupAmount: number; expectedPayout: number; currentWeekNumber: number; cycleId: string | null; avatarUrl: string | null; };
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
  
  // Avatar Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const prevUnreadCount = useRef(0);

  // Initial load for dashboard data
  useEffect(() => {
    fetch("/api/member/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.member) {
          setMember(d.member); setWeekly(d.weeklyStatus || []); setPayments(d.payments || []); setPayoutStatus(d.payoutStatus || null);
          
          // Check if there is an overdue week (1 week past due) to play the alarm
          const now = new Date();
          const hasOverdue = (d.weeklyStatus || []).some((w: any) => {
            if (w.status === "FULL") return false;
            const due = new Date(w.dueDate);
            const gracePeriod = new Date(due.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 days
            return now > gracePeriod; // It is overdue if today is past the 7-day grace period
          });

          if (hasOverdue) {
            // Wait 1.5 seconds for page to fully load and React to attach event listeners
            setTimeout(() => playAlarm(), 1500); 
          }
        }
      }).finally(() => setChecking(false));
  }, [refreshKey]);

  // Notification poller (checks every 10 seconds)
  useEffect(() => {
    function fetchNotifications() {
      fetch("/api/member/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { notifications: [] }))
        .then((d) => {
          const notifs = d.notifications || [];
          setNotifications(notifs);
          
          const unread = notifs.filter((n: any) => !n.readAt).length;
          // If new notification arrives (and it's not the first load)
          if (unread > prevUnreadCount.current && prevUnreadCount.current !== 0) {
            playAlarm();
          }
          prevUnreadCount.current = unread;
        })
        .catch(() => {});
    }

    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval); 
  }, []);

  function playAlarm() {
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // 50% volume
      audioRef.current.play().catch(e => {
        console.log("Browser blocked audio. User needs to interact first.", e);
      });
    }
  }

  // --- AVATAR UPLOAD LOGIC ---
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resizedBase64 = await resizeImage(file, 150, 150);
      
      const res = await fetch("/api/member/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarBase64: resizedBase64 }),
      });

      if (res.ok) {
        setRefreshKey((k) => k + 1); // Refresh data to show the new avatar
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-slate-500">Loading…</div></div>;
  
  if (!member) return (
    <>
      <MemberLogin onSuccess={() => setRefreshKey((k) => k + 1)} />
      <InstallBanner />
    </>
  );

  return (
    <>
      {/* Hidden Audio Player for Alarm (Using a standard web audio file) */}
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" 
        preload="auto" 
      />

      <MemberDashboard
        member={member} weekly={weekly} payments={payments} payoutStatus={payoutStatus} notifications={notifications}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        onLogout={async () => { await fetch("/api/member/logout", { method: "POST" }); setMember(null); }}
        uploading={uploading}
        handleAvatarClick={handleAvatarClick}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
      />
      <InstallBanner />
    </>
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
      
      // Force a play on the user's click just before logging in, to "unlock" the audio engine in the browser
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0;
      audio.play().catch(() => {});

      onSuccess();
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌳</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#0a3d2a" }}>Amazing Grace <span style={{ color: "#16a34a" }}>Susu</span></h1>
          <p className="text-sm text-slate-500 mt-1">Member Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-sm font-semibold text-slate-700">Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          <div><label className="text-sm font-semibold text-slate-700">Password / PIN</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full text-white font-bold py-3 rounded-xl disabled:opacity-60 shadow-lg" style={{ backgroundColor: "#16a34a" }}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

function MemberDashboard({ member, weekly, payments, payoutStatus, notifications, onRefresh, onLogout, uploading, handleAvatarClick, fileInputRef, handleFileChange }: {
  member: MemberInfo; weekly: WeeklyRow[]; payments: PaymentRow[]; payoutStatus: PayoutStatus | null; notifications: NotificationRow[];
  onRefresh: () => void; onLogout: () => void;
  uploading: boolean; handleAvatarClick: () => void; fileInputRef: React.RefObject<HTMLInputElement | null>; handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Find the FIRST week that is NOT fully paid
  const nextDueWeek = weekly.find((w) => w.status !== "FULL");

  // Determine if this unpaid week is officially "Overdue" (past the 7-day grace period)
  let isOverdue = false;
  if (nextDueWeek) {
    const now = new Date();
    const due = new Date(nextDueWeek.dueDate);
    const gracePeriodEnds = new Date(due.getTime() + (7 * 24 * 60 * 60 * 1000));
    if (now > gracePeriodEnds) {
      isOverdue = true;
    }
  }
  
  const totalPaid = weekly.reduce((s, w) => s + w.verified, 0);
  const weeksPaidCount = weekly.filter((w) => w.status === "FULL").length;
  const unreadCount = notifications.filter(n => !n.readAt).length;

  async function openNotifications() {
    setShowNotifications(true);
    if (unreadCount > 0) { 
      await fetch("/api/member/notifications", { method: "POST" }); 
      onRefresh(); 
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="text-white px-5 pt-8 pb-24 rounded-b-[2.5rem]" style={{ backgroundColor: "#16a34a" }}>
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm shadow-inner">
              <span className="text-3xl">🌳</span>
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight leading-tight">
                Amazing Grace Susu
              </div>
              <div className="text-[10px] font-medium tracking-widest text-green-100 uppercase">
                Save Together • Grow Together
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-green-500/50 pt-5">
            <div>
              <div className="text-xs text-green-100 mb-1">Welcome back 👋</div>
              <div className="text-2xl font-bold">{member.fullName}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={openNotifications} className="relative bg-white/20 hover:bg-white/30 transition p-2.5 rounded-xl">
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-green-600 animate-pulse">{unreadCount}</span>}
              </button>
              <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 transition px-3 py-2.5 rounded-xl text-xs font-bold">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-16 space-y-4">
        
        {/* PROFILE CARD WITH AVATAR UPLOAD */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center gap-4">
          <div className="relative group">
            <div 
              onClick={handleAvatarClick}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner cursor-pointer overflow-hidden relative" 
              style={!member.avatarUrl ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                member.fullName.charAt(0).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition">
                <span className="text-white text-[10px] font-bold text-center">
                  {uploading ? "..." : "Edit"}
                </span>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg leading-tight">{member.fullName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{member.phone}</div>
            <div className="text-xs text-slate-400 mt-1">Joined: {new Date(member.joinedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* ONLY SHOW THE RED ALARM IF IT IS OVERDUE BY 1 WEEK */}
        {nextDueWeek && isOverdue && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <div className="text-sm font-bold text-red-700">Payment Overdue for Week {nextDueWeek.weekNumber}</div>
                <div className="text-xs text-red-600 font-medium">Please send GH₵{nextDueWeek.expected} to the Admin immediately.</div>
              </div>
            </div>
          </div>
        )}

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
