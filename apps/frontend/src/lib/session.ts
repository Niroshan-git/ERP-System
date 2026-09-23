const encoder = new TextEncoder();

export const SESSION_COOKIE = "ceylon_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h — floor shift length, not a SaaS "remember me"

export type SessionPayload = {
  email: string;
  fullName: string;
  exp: number;
  /**
   * Derived once at login from the real ERPNext roles for this email (see
   * lib/erpnext.ts's resolveActorRoles(), backed by smart_factory's resolve_actor_roles) —
   * never trust a client-supplied value for this. Deliberately just one coarse flag rather
   * than the full role list: keeps the signed cookie small and ties Ceylon Stack's one
   * currently-needed access tier to something that already exists in real ERPNext, instead
   * of inventing Support/Audit tiers with no backing role yet (see
   * docs/observability-architecture.md's session/role design note). Absent on cookies issued
   * before this field existed — treated as `false` by callers, not a crash.
   */
  isSystemManager?: boolean;
};

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — see apps/frontend/.env.local.example");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function signSession(
  email: string,
  fullName: string,
  isSystemManager = false,
): Promise<string> {
  const payload: SessionPayload = { email, fullName, isSystemManager, exp: Date.now() + SESSION_TTL_MS };
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const sigB64 = bytesToBase64Url(new Uint8Array(sig));
  return `${body}.${sigB64}`;
}

export async function verifySession(cookieValue: string | undefined): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const [body, sig] = cookieValue.split(".");
  if (!body || !sig) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(sig), encoder.encode(body));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
