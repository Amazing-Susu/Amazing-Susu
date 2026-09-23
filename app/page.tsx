import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #f0fdf4, #d1fae5)" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#0a3d2a" }}>
          Amazing <span style={{ color: "#16a34a" }}>Susu</span>
        </h1>
        <p className="mb-8" style={{ color: "#166534" }}>
          Save Together • Grow Together
        </p>

        <div className="space-y-3">
          <Link
            href="/admin"
            className="block w-full text-white font-semibold py-4 rounded-2xl transition"
            style={{ backgroundColor: "#16a34a" }}
          >
            Administrator Login
          </Link>
          <Link
            href="/member"
            className="block w-full bg-white border-2 font-semibold py-4 rounded-2xl transition"
            style={{ borderColor: "#16a34a", color: "#15803d" }}
          >
            Member Login
          </Link>
        </div>

        <p className="text-xs mt-8" style={{ color: "#166534" }}>
          Secure • Reliable • Transparent
        </p>
      </div>
    </div>
  );
}
