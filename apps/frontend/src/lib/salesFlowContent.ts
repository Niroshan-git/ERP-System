import { ClipboardList, FilePenLine, ReceiptText, Truck, type LucideIcon } from "lucide-react";

/**
 * Static, hand-written reference content for the Dashboard's "Sales Flow" tab — a
 * SAP B1-style process map explaining how the sales cycle works, not live document data
 * (see components/RelationshipMap.tsx for the per-document version of that). Icons match
 * the ones already used for these doctypes in Sidebar.tsx and RelationshipMap.tsx so the
 * whole app stays visually consistent.
 */
export type SalesFlowStage = {
  id: "quotation" | "sales-order" | "delivery-note" | "sales-invoice";
  label: string;
  icon: LucideIcon;
  href: string;
  blurb: string;
};

export const SALES_FLOW_STAGES: SalesFlowStage[] = [
  {
    id: "quotation",
    label: "Quotation",
    icon: FilePenLine,
    href: "/sales/quotations",
    blurb:
      "A price offer sent to a customer before they commit — line items, pricing, and a validity date. Once accepted, convert it into a Sales Order, in full or partially.",
  },
  {
    id: "sales-order",
    label: "Sales Order",
    icon: ClipboardList,
    href: "/sales/orders",
    blurb:
      "The customer's confirmed order — created from a Quotation or entered standalone. Tracks how much has been delivered and billed as you fulfil it, and can be invoiced directly if you don't need to track stock movement (the \"Skip Delivery Note\" option).",
  },
  {
    id: "delivery-note",
    label: "Delivery Note",
    icon: Truck,
    href: "/sales/delivery-notes",
    blurb:
      "Records goods actually leaving the warehouse against a Sales Order, including batch/serial tracking where needed. Optional — only used when stock is physically shipped, not for service-only orders.",
  },
  {
    id: "sales-invoice",
    label: "Sales Invoice",
    icon: ReceiptText,
    href: "/sales/invoices",
    blurb:
      "The customer's bill — created from a Delivery Note once goods ship, or directly from a Sales Order. Tracks the outstanding amount until it's paid.",
  },
];
