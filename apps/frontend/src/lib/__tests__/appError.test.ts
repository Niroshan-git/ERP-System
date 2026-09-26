import { describe, expect, it } from "vitest";
import { classifyBoundaryError, classifyStatus, isRetryable, safeMessageFor, toAppError } from "../appError";

/** Minimal shape matching `lib/erpnext.ts`'s real `ErpNextError` without importing that
 * `"server-only"`-guarded module — appError.ts's own `isErpNextErrorShape()` is structural,
 * not `instanceof`-based, precisely so this is possible. */
function fakeErpNextError(status: number, correlationId: string, extra: Partial<{ erpnextMessage: string }> = {}) {
  return Object.assign(new Error(`ERPNext ${status} on /api/resource/Sales Order`), {
    status,
    correlationId,
    ...extra,
  });
}

describe("classifyStatus", () => {
  it("maps known HTTP/ERPNext statuses to the right code", () => {
    expect(classifyStatus(0)).toBe("NETWORK_ERROR");
    expect(classifyStatus(401)).toBe("AUTH_REQUIRED");
    expect(classifyStatus(403)).toBe("FORBIDDEN");
    expect(classifyStatus(404)).toBe("NOT_FOUND");
    expect(classifyStatus(409)).toBe("CONFLICT");
    expect(classifyStatus(417)).toBe("VALIDATION_ERROR");
    expect(classifyStatus(422)).toBe("VALIDATION_ERROR");
    expect(classifyStatus(429)).toBe("RATE_LIMITED");
    expect(classifyStatus(408)).toBe("TIMEOUT");
    expect(classifyStatus(500)).toBe("ERP_UNAVAILABLE");
    expect(classifyStatus(503)).toBe("ERP_UNAVAILABLE");
  });

  it("falls back to UNKNOWN for an unrecognized status", () => {
    expect(classifyStatus(418)).toBe("UNKNOWN");
  });
});

describe("toAppError — ErpNextError-shaped input", () => {
  it("classifies a network failure (status 0) as retryable NETWORK_ERROR", () => {
    const result = toAppError(fakeErpNextError(0, "CS-260925-AAAAAA"));
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.retryable).toBe(true);
    expect(result.correlationId).toBe("CS-260925-AAAAAA");
  });

  it("classifies a 500 as ERP_UNAVAILABLE and retryable", () => {
    const result = toAppError(fakeErpNextError(500, "CS-260925-BBBBBB"));
    expect(result.code).toBe("ERP_UNAVAILABLE");
    expect(result.retryable).toBe(true);
    expect(result.userMessage).toMatch(/ERP service temporarily unavailable/i);
  });

  it("classifies a 403 as FORBIDDEN and NOT retryable, using safe copy only", () => {
    const result = toAppError(fakeErpNextError(403, "CS-260925-CCCCCC"));
    expect(result.code).toBe("FORBIDDEN");
    expect(result.retryable).toBe(false);
    expect(result.userMessage).toBe(safeMessageFor("FORBIDDEN"));
  });

  it("classifies a 404 as NOT_FOUND and not retryable", () => {
    const result = toAppError(fakeErpNextError(404, "CS-260925-DDDDDD"));
    expect(result.code).toBe("NOT_FOUND");
    expect(result.retryable).toBe(false);
  });

  it("surfaces ERPNext's own validation message for a 417/VALIDATION_ERROR", () => {
    const result = toAppError(
      fakeErpNextError(417, "CS-260925-EEEEEE", { erpnextMessage: "Qty must be greater than 0 for item ABC-123" }),
    );
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.userMessage).toBe("Qty must be greater than 0 for item ABC-123");
  });

  it("falls back to safe copy for VALIDATION_ERROR when ERPNext gave no message", () => {
    const result = toAppError(fakeErpNextError(417, "CS-260925-FFFFFF"));
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.userMessage).toBe(safeMessageFor("VALIDATION_ERROR"));
  });

  it("never surfaces ERPNext's raw message text for non-validation/conflict codes, even if present", () => {
    const result = toAppError(
      fakeErpNextError(500, "CS-260925-GGGGGG", {
        erpnextMessage: "Traceback (most recent call last): File /home/frappe/... internal path leak",
      }),
    );
    expect(result.userMessage).toBe(safeMessageFor("ERP_UNAVAILABLE"));
    expect(result.userMessage).not.toMatch(/Traceback|frappe|\/home\//);
  });
});

describe("toAppError — plain Error / unknown input", () => {
  it("classifies a raw connection-refused Error as NETWORK_ERROR without leaking the raw message into userMessage", () => {
    const result = toAppError(new Error("fetch failed: connect ECONNREFUSED 10.0.0.5:8000"));
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.retryable).toBe(true);
    expect(result.userMessage).not.toMatch(/10\.0\.0\.5|ECONNREFUSED/);
  });

  it("classifies a timeout Error as TIMEOUT", () => {
    const result = toAppError(new Error("The operation timed out after 30000ms"));
    expect(result.code).toBe("TIMEOUT");
  });

  it("classifies an unrecognized Error as INTERNAL_ERROR, safe copy only", () => {
    const result = toAppError(new Error("Cannot read properties of undefined (reading 'items')"));
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.userMessage).toBe(safeMessageFor("INTERNAL_ERROR"));
  });

  it("classifies a non-Error thrown value as UNKNOWN without throwing itself", () => {
    const result = toAppError("just a string");
    expect(result.code).toBe("UNKNOWN");
    expect(result.retryable).toBe(true);
  });
});

describe("classifyBoundaryError — the client error.tsx/global-error.tsx path", () => {
  it("prefers the pre-set digest (a Ceylon Stack correlation ID) as the reference, unmodified", () => {
    const err = Object.assign(new Error("ERPNext 503 on /api/resource/Sales Order"), { digest: "CS-260925-HHHHHH" });
    const result = classifyBoundaryError(err);
    expect(result.correlationId).toBe("CS-260925-HHHHHH");
    expect(result.code).toBe("ERP_UNAVAILABLE");
  });

  it("falls back to UNKNOWN with safe, non-alarming copy when the message is Next's generic production placeholder", () => {
    const err = Object.assign(
      new Error("An error occurred in the Server Components render. The specific message is omitted in production builds..."),
      { digest: "3199238123" },
    );
    const result = classifyBoundaryError(err);
    expect(result.code).toBe("UNKNOWN");
    expect(result.correlationId).toBe("3199238123");
    expect(result.userMessage).toBe(safeMessageFor("UNKNOWN"));
  });

  it("has no correlationId when no digest is present at all", () => {
    const result = classifyBoundaryError(new Error("boom"));
    expect(result.correlationId).toBeUndefined();
  });

  it("never echoes the raw error message as userMessage, even for a recognizable network failure", () => {
    const err = Object.assign(new Error("fetch failed: ECONNREFUSED 127.0.0.1:8000"), { digest: "abc123" });
    const result = classifyBoundaryError(err);
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.userMessage).not.toMatch(/127\.0\.0\.1|ECONNREFUSED/);
    // The raw message is still available on `.message` for server-side/dev use, just never in userMessage.
    expect(result.message).toMatch(/ECONNREFUSED/);
  });
});

describe("isRetryable / safeMessageFor", () => {
  it("marks every write-adjacent/expected condition as not retryable", () => {
    expect(isRetryable("FORBIDDEN")).toBe(false);
    expect(isRetryable("VALIDATION_ERROR")).toBe(false);
    expect(isRetryable("NOT_FOUND")).toBe(false);
    expect(isRetryable("CONFLICT")).toBe(false);
    expect(isRetryable("AUTH_REQUIRED")).toBe(false);
  });

  it("marks every transient/infrastructure condition as retryable", () => {
    expect(isRetryable("ERP_UNAVAILABLE")).toBe(true);
    expect(isRetryable("TIMEOUT")).toBe(true);
    expect(isRetryable("NETWORK_ERROR")).toBe(true);
    expect(isRetryable("RATE_LIMITED")).toBe(true);
  });

  it("returns non-empty safe copy for every known code", () => {
    const codes = [
      "AUTH_REQUIRED",
      "FORBIDDEN",
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "CONFLICT",
      "ERP_UNAVAILABLE",
      "TIMEOUT",
      "NETWORK_ERROR",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "UNKNOWN",
    ] as const;
    for (const code of codes) {
      expect(safeMessageFor(code).length).toBeGreaterThan(0);
    }
  });
});
