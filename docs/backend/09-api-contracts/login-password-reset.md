# Login and password-reset integration (2026-09-24)

This integrates the existing login redesign and its standalone reference
`docs/brand/package/ceylonstack-login.html`. It does not change session issuance, roles,
service-account authorization or ERPNext core. Release acceptance is not asserted.

The illustrative role preview is labelled sample data and makes no authentication request.
Remember-email stores only the email in localStorage. Passwords are never persisted there.
Real sign-in continues through the existing `/api/auth/login` endpoint. The `next` destination
is restricted to a local path: schemes, protocol-relative URLs, backslashes and whitespace/
control characters are rejected. Network failures display a generic sign-in error.

## Reset contract

`POST /api/auth/forgot-password`, JSON `{ "email": "user@example.test" }`:

- Malformed JSON, non-string email, invalid email shape or length over 254: HTTP 400.
- Valid input is trimmed and delegated through `lib/erpnext.ts::requestPasswordReset`.
- Current Frappe mapping: anonymous form-encoded POST to
  `/api/method/frappe.core.doctype.user.user.reset_password`, field `user=email`.
  No service credentials, browser cookie or password is forwarded.
- If the HTTP request completes, the app returns `{ "ok": true }`, including for upstream
  rejection. It deliberately does not expose whether an account exists. This acknowledges
  the request, not email delivery. Upstream rejection logs only status/path, not the email.
- Connection failure or missing ERP URL: generic HTTP 502. Upstream error bodies are not
  returned to the browser. All reset tokens and email generation remain Frappe-owned.

Canonical behavior `AUTH-RESET-001`: delegate account recovery to the system of record;
do not disclose account existence or implement token generation in the frontend.

Source reference: [Frappe version-16 user controller](https://github.com/frappe/frappe/blob/version-16/frappe/core/doctype/user/user.py),
`reset_password`, inspected 2026-09-24. The upstream branch has guest access and a rate-limit
decorator; its handler catches missing-user and email errors and returns a generic message.
This is upstream-source evidence, not confirmation of the installed version or configured
limit. The proxy does not forward a caller-supplied IP header. Consequently Frappe may see
the Next.js server egress address for every requester and apply its limit across the whole
app. Verify the deployed proxy/client-IP setup and effective limit before public release.

Validation: 16 offline scenarios covered invalid/valid reset inputs, connection failure,
anonymous transport and accepted/rejected redirect destinations. Targeted ESLint and
isolated TypeScript passed. No actual reset email was requested. Installed reset settings,
rate limiting, email delivery, browser sign-in, responsive appearance and accessibility
remain NEEDS_VERIFICATION before release. The standalone HTML remains a design reference,
not a second production login endpoint.
