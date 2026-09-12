"""Thin async REST client for ERPNext/Frappe.

Talks to ERPNext purely through its REST API (token auth) - never touches
Frappe core, never assumes any custom app or module is installed. Kept
generic on purpose: business-specific tools (Work Order, Job Card, BOM,
...) are deferred until Phase 0 (docs/erp-inventory.md) exists, per
docs/mcp-agents-plan.md.
"""

from __future__ import annotations

from typing import Any

import httpx

try:
    from .config import Config
except ImportError:  # running as a script, not part of the `src` package
    from config import Config


class ERPNextError(RuntimeError):
    """Raised when ERPNext returns a non-2xx response, with its own error surfaced."""


class ERPNextClient:
    def __init__(self, config: Config):
        self._config = config
        self._client = httpx.AsyncClient(
            base_url=config.erpnext_url,
            headers={
                "Authorization": f"token {config.api_key}:{config.api_secret}",
                "Accept": "application/json",
            },
            timeout=30.0,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        response = await self._client.request(method, path, **kwargs)
        if response.is_error:
            raise ERPNextError(_extract_error(response))
        payload = response.json()
        # /api/method/... RPC calls wrap the result under "message";
        # /api/resource/... REST calls wrap it under "data". Unwrap whichever applies.
        if "message" in payload:
            return payload["message"]
        if "data" in payload:
            return payload["data"]
        return payload

    async def get_logged_user(self) -> str:
        return await self._request("GET", "/api/method/frappe.auth.get_logged_user")

    async def get_list(
        self,
        doctype: str,
        filters: dict[str, Any] | None = None,
        fields: list[str] | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {
            "doctype": doctype,
            "limit_page_length": limit,
            "limit_start": offset,
        }
        if filters is not None:
            params["filters"] = _json(filters)
        if fields is not None:
            params["fields"] = _json(fields)
        result = await self._request(
            "GET", "/api/method/frappe.client.get_list", params=params
        )
        return result or []

    async def get_doc(self, doctype: str, name: str) -> dict[str, Any]:
        result = await self._request(
            "GET", f"/api/resource/{doctype}/{_url_quote(name)}"
        )
        return result


def _json(value: Any) -> str:
    import json

    return json.dumps(value)


def _url_quote(value: str) -> str:
    from urllib.parse import quote

    return quote(value, safe="")


def _extract_error(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return f"ERPNext request failed ({response.status_code}): {response.text[:500]}"

    message = body.get("exception") or body.get("message")
    server_messages = body.get("_server_messages")
    parts = [p for p in (message, server_messages) if p]
    detail = " | ".join(str(p) for p in parts) or response.text[:500]
    return f"ERPNext request failed ({response.status_code}): {detail}"
