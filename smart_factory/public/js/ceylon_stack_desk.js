// Ceylon Stack Desk branding.
// The sidebar/app-switcher title+logo are already rewritten server-side by
// smart_factory.boot.set_ceylon_stack_branding (see hooks.py: boot_session).
// This file is a safety net for any leftover "ERPNext"/"Frappe" text in
// chrome elements that read from cached client state rather than fresh
// boot data (e.g. a stale service worker or an already-open tab).

frappe.after_ajax(() => {
	const relabel = () => {
		document.querySelectorAll(".header-subtitle").forEach((el) => {
			if (el.textContent.trim() === "ERPNext" || el.textContent.trim() === "Frappe Framework") {
				el.textContent = "CeylonStack";
			}
		});
	};

	relabel();
	new MutationObserver(relabel).observe(document.body, { childList: true, subtree: true });
});
