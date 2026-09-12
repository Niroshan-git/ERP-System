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
    from .erpnext_client import ERPNextClient
except ImportError:  # running as a script (e.g. `mcp dev src/server.py`)
    from config import load_config
    from erpnext_client import ERPNextClient

DEFAULT_LIST_LIMIT = 100
MAX_LIST_LIMIT = 2000
MAX_DOCTYPE_PAGE = 500

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


if __name__ == "__main__":
    mcp.run()
