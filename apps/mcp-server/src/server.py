"""Ceylon Stack developer MCP server.

Dev-tier server: full read access to the underlying ERPNext instance for
the developer, via generic *discovery* tools - nothing here assumes a
specific module or DocType exists. Business tools (Work Order, Job Card,
BOM, ...) are intentionally deferred until Phase 0 (docs/erp-inventory.md)
exists, per docs/mcp-agents-plan.md.

This is the full-access dev tier, not what a client would eventually get -
see the "Two-tier access model" section in apps/mcp-server/README.md for
the planned role-scoped client tier (not built yet).

Run:
    python -m src.server                 # stdio, for a real MCP client
    mcp dev src/server.py                # MCP inspector, for manual testing
"""

from __future__ import annotations

from typing import Any

from mcp.server.mcpserver import MCPServer

try:
    from .config import load_config
    from .erpnext_client import ERPNextClient, ERPNextError
except ImportError:  # running as a script (e.g. `mcp dev src/server.py`)
    from config import load_config
    from erpnext_client import ERPNextClient, ERPNextError

DEFAULT_LIST_LIMIT = 100
MAX_LIST_LIMIT = 2000
MAX_DOCTYPE_PAGE = 500
RECENT_RECORDS_LIMIT = 5
WORK_ORDER_JOB_CARDS_LIMIT = 50
QUALITY_INSPECTIONS_LIMIT = 5
LIST_WORK_ORDERS_DEFAULT_LIMIT = 20
LIST_WORK_ORDERS_MAX_LIMIT = 100

# Header fields returned by get_work_order_detail, per docs/erp-inventory.md's
# confirmed Work Order schema (live-verified via get_doctype_fields, not guessed).
WORK_ORDER_DETAIL_FIELDS = [
    "name",
    "status",
    "company",
    "production_item",
    "item_name",
    "qty",
    "produced_qty",
    "process_loss_qty",
    "planned_start_date",
    "planned_end_date",
    "bom_no",
]

# Job Card fields, per docs/erp-inventory.md's naming-series correction
# (PO-JOB.#####, not JC-.YYYY.-) and live-verified schema.
JOB_CARD_DETAIL_FIELDS = [
    "name",
    "operation",
    "workstation",
    "status",
    "for_quantity",
    "total_completed_qty",
    "expected_start_date",
    "expected_end_date",
    "actual_start_date",
    "actual_end_date",
]

# The one finished good on the live instance today (per docs/erp-inventory.md,
# Phase 0 walkthrough) - the readiness check needs a concrete item to check
# `quality_inspection_template` against.
QUALITY_READINESS_ITEM = "FG-STEEL-BRACKET-ASSY"

# List-view fields for list_work_orders - a subset of WORK_ORDER_DETAIL_FIELDS
# plus creation, since this tool exists to help a caller discover a Work
# Order name (not inspect one in full - that's get_work_order_detail).
WORK_ORDER_LIST_FIELDS = [
    "name",
    "status",
    "company",
    "production_item",
    "item_name",
    "qty",
    "produced_qty",
    "bom_no",
    "planned_start_date",
    "planned_end_date",
    "creation",
]

mcp = MCPServer(
    "ceylon-stack",
    title="Ceylon Stack Developer Data Access",
    description=(
        "Full read access to Ceylon Stack's underlying data platform, for "
        "development and administration use. A separate, role-scoped tier "
        "is planned for client-facing use (see project docs) - this server "
        "is the unrestricted developer tier, not that one."
    ),
)

_config = load_config()
_client = ERPNextClient(_config)


@mcp.tool()
async def ping() -> dict[str, str]:
    """Verify the Ceylon Stack data connection is working and show which account it's using."""
    user = await _client.get_logged_user()
    return {"erpnext_url": _config.erpnext_url, "logged_in_as": user}


@mcp.tool()
async def list_doctypes(module: str | None = None) -> list[dict[str, Any]]:
    """List the record types available in Ceylon Stack's data platform, optionally filtered by module."""
    filters = {"module": module} if module else None
    return await _client.get_list(
        "DocType",
        filters=filters,
        fields=["name", "module", "istable"],
        limit=MAX_DOCTYPE_PAGE,
    )


@mcp.tool()
async def get_doctype_fields(doctype: str) -> list[dict[str, Any]]:
    """Get the field schema (fieldname, label, fieldtype, reqd, options) for a record type."""
    doc = await _client.get_doc("DocType", doctype)
    fields = doc.get("fields", [])
    return [
        {
            "fieldname": f.get("fieldname"),
            "label": f.get("label"),
            "fieldtype": f.get("fieldtype"),
            "reqd": bool(f.get("reqd")),
            "options": f.get("options"),
        }
        for f in fields
    ]


@mcp.tool()
async def list_documents(
    doctype: str,
    filters: dict[str, Any] | None = None,
    fields: list[str] | None = None,
    limit: int = DEFAULT_LIST_LIMIT,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Generically read records of any type from Ceylon Stack's data platform, read-only and paginated.

    Full developer read access: any record type, any filter/field selection.
    Each call is still bounded (default 100, hard ceiling 2000 rows) so a
    stray large `limit` can't pull an entire table in one request against
    the live server - page through larger result sets with `offset`.
    """
    bounded_limit = max(1, min(limit, MAX_LIST_LIMIT))
    return await _client.get_list(
        doctype, filters=filters, fields=fields, limit=bounded_limit, offset=offset
    )


@mcp.tool()
async def get_manufacturing_overview() -> dict[str, Any]:
    """Compact, read-only Manufacturing readiness/status overview from live ERPNext.

    Dev-tier reporting tool: counts of key Manufacturing DocTypes, a bounded
    list of recent Work Orders and Job Cards, whether the reference finished
    good has a Quality Inspection Template attached, and a gaps list flagging
    missing/risky readiness items. Not a client-scoped agent - see
    apps/mcp-server/README.md's "Two-tier access model".
    """
    counts = {
        "boms": await _client.get_count("BOM"),
        "workstations": await _client.get_count("Workstation"),
        "work_orders": await _client.get_count("Work Order"),
        "job_cards": await _client.get_count("Job Card"),
        "quality_inspection_templates": await _client.get_count(
            "Quality Inspection Template"
        ),
    }

    recent_work_orders = await _client.get_list(
        "Work Order",
        fields=[
            "name",
            "production_item",
            "qty",
            "produced_qty",
            "status",
            "company",
            "planned_start_date",
        ],
        limit=RECENT_RECORDS_LIMIT,
        order_by="modified desc",
    )

    recent_job_cards = await _client.get_list(
        "Job Card",
        fields=[
            "name",
            "work_order",
            "operation",
            "workstation",
            "status",
            "for_quantity",
            "total_completed_qty",
        ],
        limit=RECENT_RECORDS_LIMIT,
        order_by="modified desc",
    )

    gaps: list[str] = []

    quality_readiness: dict[str, Any] = {"item": QUALITY_READINESS_ITEM}
    try:
        item = await _client.get_doc("Item", QUALITY_READINESS_ITEM)
        template = item.get("quality_inspection_template")
        quality_readiness["has_quality_inspection_template"] = bool(template)
        quality_readiness["quality_inspection_template"] = template
        if not template:
            gaps.append(
                f"Reference item {QUALITY_READINESS_ITEM} has no "
                "quality_inspection_template set."
            )
    except ERPNextError as exc:
        # Covers any non-2xx response (missing item, permission issue,
        # transient server error), not just "item not found" - report it as
        # unverified rather than asserting the item doesn't exist.
        quality_readiness["has_quality_inspection_template"] = False
        quality_readiness["quality_inspection_template"] = None
        quality_readiness["error"] = f"Could not read Item {QUALITY_READINESS_ITEM}: {exc}"
        gaps.append(
            f"Reference item {QUALITY_READINESS_ITEM} readiness could not be "
            "verified (see quality_readiness.error)."
        )

    if counts["boms"] == 0:
        gaps.append("No BOMs exist - Manufacturing cannot run without at least one.")
    if counts["workstations"] == 0:
        gaps.append("No Workstations exist.")
    if counts["work_orders"] == 0:
        gaps.append("No Work Orders exist yet.")
    if counts["quality_inspection_templates"] == 0:
        gaps.append("No Quality Inspection Templates exist anywhere on the instance.")

    return {
        "counts": counts,
        "recent_work_orders": recent_work_orders,
        "recent_job_cards": recent_job_cards,
        "quality_readiness": quality_readiness,
        "gaps": gaps,
        "source": (
            "Dev-tier read-only data from live ERPNext (Administrator API key), "
            "not a client-scoped agent - see apps/mcp-server/README.md."
        ),
    }


@mcp.tool()
async def get_work_order_detail(work_order_name: str) -> dict[str, Any]:
    """Compact, read-only detail for a single Work Order: header fields, its Job
    Cards, and Quality readiness.

    Dev-tier reporting tool, extending get_manufacturing_overview to a single
    record. Returns the Work Order header (status, production item, qty,
    planned/actual dates, BOM), its Job Cards ordered by creation, whether the
    production item has a Quality Inspection Template attached, and a bounded
    list of Quality Inspection records found for that item. Not a client-scoped
    agent - see apps/mcp-server/README.md's "Two-tier access model".
    """
    name = (work_order_name or "").strip()
    if not name:
        return {"error": "work_order_name is required and cannot be empty."}

    try:
        doc = await _client.get_doc("Work Order", name)
    except ERPNextError as exc:
        return {
            "error": f"Work Order '{name}' could not be read: {exc}",
            "work_order_name": name,
        }

    work_order = {field: doc.get(field) for field in WORK_ORDER_DETAIL_FIELDS}
    missing_fields = [f for f in WORK_ORDER_DETAIL_FIELDS if f not in doc]

    job_cards = await _client.get_list(
        "Job Card",
        filters={"work_order": name},
        fields=JOB_CARD_DETAIL_FIELDS,
        limit=WORK_ORDER_JOB_CARDS_LIMIT,
        order_by="creation asc",
    )

    production_item = work_order.get("production_item")
    quality_readiness: dict[str, Any] = {"production_item": production_item}
    if production_item:
        try:
            item = await _client.get_doc("Item", production_item)
            template = item.get("quality_inspection_template")
            quality_readiness["item_quality_inspection_template"] = template
        except ERPNextError as exc:
            quality_readiness["item_quality_inspection_template"] = None
            quality_readiness["item_lookup_error"] = (
                f"Could not read Item {production_item}: {exc}"
            )

        quality_readiness["quality_inspections_found"] = await _client.get_list(
            "Quality Inspection",
            filters={"item_code": production_item},
            fields=["name", "status", "inspection_type", "reference_type", "reference_name"],
            limit=QUALITY_INSPECTIONS_LIMIT,
            order_by="creation desc",
        )
        quality_readiness["note"] = (
            "Quality Inspection links to Job Card (reference_type/reference_name), "
            "not directly to Work Order - checked by production item (item_code) match only."
        )
    else:
        quality_readiness["item_quality_inspection_template"] = None
        quality_readiness["quality_inspections_found"] = []
        quality_readiness["note"] = (
            "Work Order has no production_item set - quality readiness could not be checked."
        )

    gaps: list[str] = []
    if not work_order.get("bom_no"):
        gaps.append(f"Work Order {name} has no bom_no set.")
    if not job_cards:
        gaps.append(f"No Job Cards found for Work Order {name}.")
    if production_item and not quality_readiness.get("item_quality_inspection_template"):
        gaps.append(
            f"Production item {production_item} has no quality_inspection_template set."
        )
    if missing_fields:
        # These fields ARE defined on the Work Order doctype (confirmed via
        # get_doctype_fields) but ERPNext's REST response omitted the key
        # entirely rather than returning null - observed live for terminal
        # (Completed/Cancelled) Work Orders, e.g. planned_end_date. Not
        # necessarily an error or schema drift; flagged so a caller knows the
        # value is unknown rather than confirmed-empty.
        gaps.append(
            "Fields ERPNext omitted from this Work Order's API response "
            f"(defined on the doctype, but not returned for this record): "
            f"{', '.join(missing_fields)}."
        )

    return {
        "work_order": work_order,
        "job_cards": job_cards,
        "quality_readiness": quality_readiness,
        "gaps": gaps,
        "source": (
            "Dev-tier read-only data from live ERPNext (Administrator API key), "
            "not a client-scoped agent - see apps/mcp-server/README.md."
        ),
    }


@mcp.tool()
async def list_work_orders(
    status: str | None = None,
    production_item: str | None = None,
    limit: int = LIST_WORK_ORDERS_DEFAULT_LIMIT,
) -> dict[str, Any]:
    """Compact, read-only list of Work Orders, optionally filtered by status and/or
    production item, newest first.

    Dev-tier discovery tool: helps a caller find the Work Order `name` to pass into
    get_work_order_detail, rather than inspecting one record in full. Not a
    client-scoped agent - see apps/mcp-server/README.md's "Two-tier access model".
    """
    bounded_limit = max(1, min(limit, LIST_WORK_ORDERS_MAX_LIMIT))

    filters: dict[str, Any] = {}
    if status:
        filters["status"] = status
    if production_item:
        filters["production_item"] = production_item

    work_orders = await _client.get_list(
        "Work Order",
        filters=filters or None,
        fields=WORK_ORDER_LIST_FIELDS,
        limit=bounded_limit,
        order_by="creation desc",
    )

    gaps: list[str] = []
    for wo in work_orders:
        missing_fields = [f for f in WORK_ORDER_LIST_FIELDS if f not in wo]
        if missing_fields:
            gaps.append(
                f"Work Order {wo.get('name', '<unknown>')} - fields ERPNext omitted "
                f"from this record's response: {', '.join(missing_fields)}."
            )

    return {
        "applied_filters": {
            "status": status,
            "production_item": production_item,
            "limit": bounded_limit,
        },
        "total_returned": len(work_orders),
        "work_orders": work_orders,
        "gaps": gaps,
        "source": (
            "Dev-tier read-only data from live ERPNext (Administrator API key), "
            "not a client-scoped agent - see apps/mcp-server/README.md."
        ),
    }


if __name__ == "__main__":
    mcp.run()
