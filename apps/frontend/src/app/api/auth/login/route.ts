import { NextResponse } from "next/server";
import { resolveActorRoles, verifyErpNextLogin } from "@/lib/erpnext";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let result;
  try {
    result = await verifyErpNextLogin(email, password);
  } catch {
    return NextResponse.json({ error: "Could not reach ERPNext. Try again shortly." }, { status: 502 });
  }

  if (!result) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Role resolution failure must not block a login that already succeeded against ERPNext's
  // own credential check — falls back to the safe default (no elevated access) rather than
  // failing the request.
  let isSystemManager = false;
  try {
    isSystemManager = (await resolveActorRoles(email)).isSystemManager;
  } catch {
    isSystemManager = false;
  }

  const cookieValue = await signSession(email, result.fullName, isSystemManager);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
