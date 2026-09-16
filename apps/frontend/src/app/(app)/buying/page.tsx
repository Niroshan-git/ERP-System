import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Buying module home page — placeholder only.
 *
 * This route exists so the module switcher (Sidebar.tsx) and the "/" module picker
 * have a real destination that doesn't 404. The full workspace (Overview tab, number
 * cards, Buying Flow map) lands in Phase 5 of the Buying + multi-module nav plan, once
 * the core purchasing doctypes (Phase 4) exist to report on.
 */
export default function BuyingHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Buying" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Buying module — coming soon</h1>
        <p className="text-sm text-graphite-500">
          Material Requests, RFQs, Supplier Quotations, Purchase Orders, Purchase Receipts,
          Purchase Invoices, and Suppliers are being built next. This page will become the
          Buying workspace home once that core flow ships.
        </p>
      </div>
    </div>
  );
}
