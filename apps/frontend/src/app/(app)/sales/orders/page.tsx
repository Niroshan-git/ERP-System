import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { SalesOrderBulkTable, type SalesOrderRow } from "@/components/SalesOrderBulkTable";
import { bulkCloseSalesOrdersAction, bulkReopenSalesOrdersAction } from "./actions";
import { bulkCreateSalesInvoicesFromOrdersAction } from "../invoices/actions";

const DELIVERY_STATUS_OPTIONS = ["Not Delivered", "Fully Delivered", "Partly Delivered", "Closed", "Not Applicable"];
const BILLING_STATUS_OPTIONS = ["Not Billed", "Fully Billed", "Partly Billed", "Closed"];
const ADVANCE_PAYMENT_STATUS_OPTIONS = ["Not Requested", "Requested", "Partially Paid", "Fully Paid"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "delivery_date asc", label: "Delivery date (soonest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  customer_name?: string;
  date?: string;
  delivery_status?: string;
  billing_status?: string;
  advance_payment_status?: string;
  sort?: string;
};

export default async function SalesOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["customer", "=", params.customer]);
  if (params.customer_name) filters.push(["customer_name", "like", `%${params.customer_name}%`]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);
  if (params.delivery_status) filters.push(["delivery_status", "=", params.delivery_status]);
  if (params.billing_status) filters.push(["billing_status", "=", params.billing_status]);
  if (params.advance_payment_status) filters.push(["advance_payment_status", "=", params.advance_payment_status]);

  const [orders, companies, customers] = await Promise.all([
    listDocs<SalesOrderRow>("Sales Order", {
      fields: [
        "name",
        "customer",
        "status",
        "docstatus",
        "delivery_date",
        "grand_total",
        "per_delivered",
        "per_billed",
        "transaction_date",
        "company",
        "currency",
        "territory",
        "owner",
      ],
      filters: filters.length > 0 ? filters : undefined,
      limit: 200,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    fetchLinkOptions("Customer"),
  ]);

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "text", name: "customer_name", label: "Customer Name" },
    { type: "date", name: "date", label: "Date" },
    { type: "select", name: "delivery_status", label: "Delivery Status", options: DELIVERY_STATUS_OPTIONS },
    { type: "select", name: "billing_status", label: "Billing Status", options: BILLING_STATUS_OPTIONS },
    {
      type: "select",
      name: "advance_payment_status",
      label: "Advance Payment Status",
      options: ADVANCE_PAYMENT_STATUS_OPTIONS,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Sales Orders</h1>
        <Link
          href="/sales/orders/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <SalesOrderBulkTable
        orders={orders}
        closeAction={bulkCloseSalesOrdersAction}
        reopenAction={bulkReopenSalesOrdersAction}
        createInvoicesAction={bulkCreateSalesInvoicesFromOrdersAction}
      />
    </div>
  );
}
