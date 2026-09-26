import { cookies } from "next/headers";
import { verifySession } from "./auth";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function getCurrentAdmin() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function getCurrentMember() {
  const session = await getCurrentSession();
  if (!session || session.role !== "member") return null;
  return session;
}
