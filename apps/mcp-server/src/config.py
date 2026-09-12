"""Configuration loading for the Ceylon Stack ERPNext MCP server."""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    erpnext_url: str
    api_key: str
    api_secret: str


def load_config() -> Config:
    """Load and validate required ERPNext connection settings.

    Raises RuntimeError with an actionable message if anything required
    is missing, rather than letting a bare `None` fail deep inside a
    request later.
    """
    erpnext_url = os.environ.get("ERPNEXT_URL", "").strip()
    api_key = os.environ.get("ERPNEXT_API_KEY", "").strip()
    api_secret = os.environ.get("ERPNEXT_API_SECRET", "").strip()

    missing = [
        name
        for name, value in (
            ("ERPNEXT_URL", erpnext_url),
            ("ERPNEXT_API_KEY", api_key),
            ("ERPNEXT_API_SECRET", api_secret),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing required ERPNext config: "
            + ", ".join(missing)
            + ". Copy apps/mcp-server/.env.example to .env and fill in real "
            "values (generate an API key/secret in ERPNext under "
            "Settings -> My Settings -> API Access). Never commit .env."
        )

    return Config(
        erpnext_url=erpnext_url.rstrip("/"),
        api_key=api_key,
        api_secret=api_secret,
    )
