"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { setTheme, useTheme } from "@/lib/theme";
import styles from "./login.module.css";

const REMEMBER_EMAIL_KEY = "ceylonstack.rememberedEmail";

type DemoRole = "sales" | "operations" | "admin";

type DemoExample = {
  name: string;
  role: string;
  summary: string;
  metrics: { value: string; label: string }[];
  tools: string[];
};

/**
 * Sample data only — mirrors docs/brand/package/ceylonstack-login.html's own "Preview demo"
 * panel exactly (names, copy, numbers). Never sent to or derived from the ERPNext backend;
 * clicking Preview demo makes no network call at all. Kept distinct from real sign-in, which
 * redirects straight into the app instead of rendering a welcome/workspace summary — there is
 * no backend endpoint yet for a signed-in user's real metrics/modules/pending work (see
 * FRONTEND_GUIDE.md §16), so this preview is illustrative-only, not a stand-in for it.
 */
const DEMO_EXAMPLES: Record<DemoRole, DemoExample> = {
  sales: {
    name: "Nethmi",
    role: "Sales executive",
    summary: "Your sales priorities, in one place.",
    metrics: [
      { value: "12", label: "Open quotations" },
      { value: "08", label: "Sales orders" },
      { value: "03", label: "Follow-ups" },
    ],
    tools: [
      "Review pending quotations",
      "Track your sales orders",
      "Manage customer follow-ups",
    ],
  },
  operations: {
    name: "Kasun",
    role: "Operations manager",
    summary: "Keep orders moving and stock in balance.",
    metrics: [
      { value: "06", label: "Deliveries due" },
      { value: "04", label: "Low-stock items" },
      { value: "09", label: "Work orders" },
    ],
    tools: [
      "Review delivery schedule",
      "Check stock availability",
      "Monitor production orders",
    ],
  },
  admin: {
    name: "Dinushi",
    role: "System administrator",
    summary: "A clear view of your workspace administration.",
    metrics: [
      { value: "24", label: "Active users" },
      { value: "03", label: "Access requests" },
      { value: "02", label: "Pending reviews" },
    ],
    tools: [
      "Manage users and permissions",
      "Review access requests",
      "View the activity log",
    ],
  },
};

const DEFAULT_MODULES: { icon: string; label: string; index: string }[] = [
  { icon: "↗", label: "Sales & customer relationships", index: "01" },
  { icon: "▤", label: "Inventory & operations", index: "02" },
  { icon: "◎", label: "People & administration", index: "03" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

/**
 * Pre-existing, unrelated to this rebuild — useSearchParams() requires a Suspense boundary
 * around whatever component calls it or `next build` fails the static prerender of this page.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [demoRole, setDemoRole] = useState<DemoRole>("sales");
  const [demoPreview, setDemoPreview] = useState<DemoExample | null>(null);

  const [dialogMode, setDialogMode] = useState<"reset" | "contact" | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const welcomeViewRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Reads localStorage only after mount, deliberately not via a useState lazy initializer —
    // that would run during the server render too (no window) and diverge from the client's
    // first hydration pass, causing a value-attribute hydration mismatch on the email input.
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {
      // localStorage unavailable — remember-email is a convenience, not required.
    }
  }, []);

  useEffect(() => {
    if (demoPreview) welcomeViewRef.current?.focus();
  }, [demoPreview]);

  function handleRememberChange(checked: boolean) {
    setRememberEmail(checked);
    if (!checked) {
      try {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } catch {
        // Ignore — nothing to clean up if storage isn't available.
      }
    }
  }

  function handlePasswordKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong. Try again.");
        return;
      }

      try {
        if (rememberEmail) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } catch {
        // Remember-email is a convenience — a storage failure shouldn't block sign-in.
      }

      setPassword("");
      const next = searchParams.get("next");
      // Accept only same-origin app paths, never a URL scheme or protocol-relative URL.
      const destination = next && next.startsWith("/") && !next.startsWith("//") &&
        !/[\\\u0000-\u0020]/.test(next) ? next : "/master-data/customers";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePreviewDemo() {
    setDemoPreview(DEMO_EXAMPLES[demoRole]);
  }

  function handleBackToSignIn() {
    setDemoPreview(null);
    emailInputRef.current?.focus();
  }

  function openDialog(mode: "reset" | "contact") {
    setDialogMode(mode);
    setResetEmail(email);
    setResetMessage(null);
    dialogRef.current?.showModal();
  }

  async function handleResetSubmit(event: FormEvent) {
    event.preventDefault();
    setResetSubmitting(true);
    setResetMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      setResetMessage(
        res.ok
          ? "If this email belongs to an account, reset instructions will be sent."
          : "Unable to request a reset. Please try again later.",
      );
    } catch {
      setResetMessage("Unable to request a reset. Please try again later.");
    } finally {
      setResetSubmitting(false);
    }
  }

  const displayModules = demoPreview
    ? demoPreview.tools.map((tool) => ({ icon: "✓", label: tool, index: undefined as string | undefined }))
    : DEFAULT_MODULES;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.scene} aria-hidden="true">
          <svg viewBox="0 0 700 850" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="csLoginMountain" x2="0" y2="1">
                <stop stopColor="#4c8492" />
                <stop offset="1" stopColor="#112b43" />
              </linearGradient>
              <pattern id="csLoginGrid" width="54" height="54" patternUnits="userSpaceOnUse">
                <path d="M54 0H0V54" fill="none" stroke="#bcefff" strokeOpacity=".07" />
              </pattern>
            </defs>
            <path d="M0 450L150 310 220 350 400 130 480 230 540 180 700 350V850H0Z" fill="url(#csLoginMountain)" />
            <path d="M0 570L190 430 300 490 490 300 700 440V850H0Z" fill="#12334a" />
            <path d="M0 740L180 550 340 650 540 470 700 600V850H0Z" fill="#091f36" />
            <path
              d="M410-40C180 130 670 240 360 370S630 610 240 900"
              fill="none"
              stroke="#9adae5"
              strokeOpacity=".5"
              strokeDasharray="4 8"
            />
            <path d="M450-40C220 130 710 240 400 370S670 610 280 900" fill="none" stroke="#9adae5" strokeOpacity=".13" />
            <rect width="700" height="850" fill="url(#csLoginGrid)" />
            <circle cx="440" cy="287" r="5" fill="#82eeff" />
          </svg>
        </div>

        <header className={styles.header}>
          <div className={styles.brand}>
            {/* Same asset in both themes — the dark-theme variant read as low-contrast against
                the shell's dark navy background, so light/dark no longer swap the logo. */}
            <Image
              src="/brand/ceylonstack-app-original-once.svg"
              alt="Ceylon Stack ERP"
              width={225}
              height={70}
              priority
              unoptimized
              className={styles.logo}
            />
          </div>
          <div className={styles.headerActions}>
            <div className={styles.topNote}>
              <span className={styles.dot} aria-hidden="true" /> Your business. Connected.
            </div>
            <button
              type="button"
              className={styles.themeToggle}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={`Current theme: ${theme}`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <span className={styles.themeIcon} aria-hidden="true">
                {theme === "light" ? "☾" : "☀"}
              </span>
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.formSide} aria-labelledby="loginTitle">
            {!demoPreview ? (
              <div>
                <p className={styles.eyebrow}>Your workspace awaits</p>
                <h1 id="loginTitle" className={styles.title}>
                  Welcome back.
                </h1>
                <p className={styles.subtitle}>Sign in to your Ceylon Stack workspace.</p>

                <form onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="email">Work email or username</label>
                    {/* type="text", not "email" — ERPNext logins aren't always an email address
                        (e.g. the built-in "Administrator" account), and type="email" would
                        block the browser from submitting anything that isn't email-shaped. */}
                    <input
                      ref={emailInputRef}
                      id="email"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="you@company.com or Administrator"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="password">Password</label>
                    <div className={styles.password}>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={handlePasswordKeyUp}
                      />
                      <button
                        type="button"
                        className={styles.show}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {capsLockOn && <div className={styles.small}>Caps Lock is on.</div>}
                  </div>

                  <div className={styles.options}>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={rememberEmail}
                        onChange={(e) => handleRememberChange(e.target.checked)}
                      />
                      Remember email
                    </label>
                    <button type="button" className={styles.link} onClick={() => openDialog("reset")}>
                      Forgot password?
                    </button>
                  </div>

                  <button className={styles.primary} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
                  </button>
                  <p className={styles.message} role="status" aria-live="polite">
                    {error}
                  </p>
                </form>

                <p className={styles.access}>
                  Need access?{" "}
                  <button type="button" className={styles.link} onClick={() => openDialog("contact")}>
                    Contact your administrator
                  </button>
                </p>

                <div className={styles.demo}>
                  <div className={styles.demoHead}>
                    <strong>Explore your workspace</strong>
                    <span>Sample data only</span>
                  </div>
                  <div className={styles.demoRow}>
                    <select
                      aria-label="Choose demo role"
                      value={demoRole}
                      onChange={(e) => setDemoRole(e.target.value as DemoRole)}
                    >
                      <option value="sales">Sales workspace</option>
                      <option value="operations">Operations workspace</option>
                      <option value="admin">Administrator workspace</option>
                    </select>
                    <button type="button" className={styles.secondary} onClick={handlePreviewDemo}>
                      Preview demo ↗
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div ref={welcomeViewRef} tabIndex={-1}>
                <div className={styles.successIcon} aria-hidden="true">
                  ✓
                </div>
                <p className={styles.eyebrow}>Demo workspace</p>
                <h1 className={styles.title}>Welcome, {demoPreview.name || "there"}.</h1>
                <p className={styles.subtitle}>{demoPreview.summary}</p>
                <p className={styles.small}>
                  This preview shows how details change by user role. No account has been signed in.
                </p>
                <button className={styles.primary} type="button" onClick={handleBackToSignIn}>
                  Back to sign in <span aria-hidden="true">←</span>
                </button>
              </div>
            )}
          </section>

          <aside className={styles.story} aria-label="Workspace overview">
            <div>
              <p className={styles.eyebrow}>Ceylon Stack ERP</p>
              <h2 className={styles.storyTitle}>
                One workspace.
                <br />A clearer view
                <br />
                of <span className={styles.storyAccent}>your business.</span>
              </h2>
              <p className={styles.storyCopy}>
                From the first quotation to the final delivery, keep your people, processes and decisions
                connected.
              </p>
            </div>

            <div className={styles.workspace}>
              <div className={styles.workspaceTop}>
                <span className={styles.workspaceTitle}>
                  {demoPreview ? demoPreview.role : "Built around your work"}
                </span>
                <span className={styles.badge}>{demoPreview ? "Demo preview" : "Connected ERP"}</span>
              </div>
              <p className={styles.workspaceDescription}>
                {demoPreview
                  ? "Illustrative priorities for this role."
                  : "Sign in to see the details and tools available to you."}
              </p>
              {demoPreview && (
                <div className={styles.stats}>
                  {demoPreview.metrics.slice(0, 3).map((metric) => (
                    <div className={styles.stat} key={metric.label}>
                      <b>{metric.value}</b>
                      <span>{metric.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.modules}>
                {displayModules.map((mod) => (
                  <div className={styles.module} key={mod.label}>
                    <i className={styles.moduleIcon} aria-hidden="true">
                      {mod.icon}
                    </i>
                    <span>{mod.label}</span>
                    {mod.index && (
                      <span className={styles.moduleIndex} aria-hidden="true">
                        {mod.index}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Ceylon Stack · ERP System</span>
          <span>Streamline today. Build tomorrow.</span>
        </footer>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="loginDialogTitle"
        onClose={() => setDialogMode(null)}
      >
        <h2 id="loginDialogTitle" className={styles.dialogTitle}>
          {dialogMode === "reset" ? "Reset your password" : "Get workspace access"}
        </h2>
        {dialogMode === "reset" ? (
          <>
            <p className={styles.dialogText}>Enter your work email to request password reset instructions.</p>
            <form onSubmit={handleResetSubmit}>
              <label htmlFor="resetEmail">Work email</label>
              <input
                id="resetEmail"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <button className={styles.primary} style={{ marginTop: 16 }} type="submit" disabled={resetSubmitting}>
                {resetSubmitting ? "Sending…" : "Send reset instructions"}
              </button>
            </form>
          </>
        ) : (
          <p className={styles.dialogText}>
            Ask your company&rsquo;s ERP administrator to create your account and assign the workspace permissions
            you need.
          </p>
        )}
        {dialogMode === "reset" && (
          <p className={`${styles.message} ${styles.messageInfo}`} role="status">
            {resetMessage}
          </p>
        )}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
