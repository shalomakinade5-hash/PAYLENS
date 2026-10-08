import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _database_path() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    configured_path = os.getenv("PAYLENS_DATABASE_PATH")
    path = Path(configured_path) if configured_path else Path("backend/data/paylens.sqlite3")
    if not path.is_absolute():
        path = project_root / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path(), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS paypal_orders (
            order_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            capture_id TEXT,
            capture_status TEXT,
            status TEXT NOT NULL,
            amount TEXT NOT NULL,
            currency TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    existing_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(paypal_orders)")
    }
    if "capture_status" not in existing_columns:
        connection.execute("ALTER TABLE paypal_orders ADD COLUMN capture_status TEXT")
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_paypal_orders_user_id "
        "ON paypal_orders(user_id)"
    )
    return connection


def save_paypal_order(
    user_id: str,
    order_id: str,
    status: str,
    amount: str,
    currency: str,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with closing(_connect()) as connection, connection:
        connection.execute(
            """
            INSERT INTO paypal_orders
                (user_id, order_id, capture_id, status, amount, currency, created_at, updated_at)
            VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
            """,
            (user_id, order_id, status, amount, currency, now, now),
        )


def get_paypal_order(user_id: str, order_id: str) -> dict[str, Any] | None:
    with closing(_connect()) as connection:
        row = connection.execute(
            """
            SELECT user_id, order_id, capture_id, status, amount, currency,
                   capture_status, created_at, updated_at
            FROM paypal_orders
            WHERE user_id = ? AND order_id = ?
            """,
            (user_id, order_id),
        ).fetchone()
    return dict(row) if row else None


def get_paypal_order_by_capture_id(
    user_id: str,
    capture_id: str,
) -> dict[str, Any] | None:
    with closing(_connect()) as connection:
        row = connection.execute(
            """
            SELECT user_id, order_id, capture_id, status, amount, currency,
                   capture_status, created_at, updated_at
            FROM paypal_orders
            WHERE user_id = ? AND capture_id = ?
            """,
            (user_id, capture_id),
        ).fetchone()
    return dict(row) if row else None


def update_paypal_order(
    user_id: str,
    order_id: str,
    status: str,
    capture_id: str | None = None,
    capture_status: str | None = None,
    amount: str | None = None,
    currency: str | None = None,
) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    with closing(_connect()) as connection, connection:
        cursor = connection.execute(
            """
            UPDATE paypal_orders
            SET status = ?,
                capture_id = COALESCE(?, capture_id),
                capture_status = COALESCE(?, capture_status),
                amount = COALESCE(?, amount),
                currency = COALESCE(?, currency),
                updated_at = ?
            WHERE user_id = ? AND order_id = ?
            """,
            (
                status,
                capture_id,
                capture_status,
                amount,
                currency,
                now,
                user_id,
                order_id,
            ),
        )
    return cursor.rowcount == 1
