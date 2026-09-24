import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/erpnext";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const email = body && typeof body === "object" && "email" in body && typeof body.email === "string"
    ? body.email.trim()
    : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    await requestPasswordReset(email);
  } catch {
    return NextResponse.json(
      { error: "Unable to request a password reset right now. Please try again shortly." },
      { status: 502 },
    );
  }

  // Deliberately opaque: this response must look identical whether or not `email` matched a
  // real ERPNext account (see requestPasswordReset's own comment) — the caller shows one
  // generic message either way.
  return NextResponse.json({ ok: true });
}
