import asyncio
import os
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from app import db
from app.api.paypal import capture_order
from app.auth import AuthenticatedUser
from fastapi import HTTPException
from app.services.paypal_service import (
    DEFAULT_RETURN_URL,
    SANDBOX_BASE_URL,
    PayPalConfiguration,
)


class PayPalOrderPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_directory.name) / "paylens.sqlite3"
        self.environment = patch.dict(
            os.environ,
            {"PAYLENS_DATABASE_PATH": str(self.database_path)},
            clear=False,
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.addCleanup(self.temp_directory.cleanup)

    def test_configuration_does_not_require_a_partner_account(self):
        configuration = PayPalConfiguration(
            client_id="sandbox-client",
            client_secret="sandbox-secret",
            base_url=SANDBOX_BASE_URL,
            return_url=DEFAULT_RETURN_URL,
        )

        self.assertTrue(configuration.is_configured)

    def test_persistence_is_user_scoped_and_tracks_capture(self):
        db.save_paypal_order(
            "user-one",
            "ORDER123",
            "CREATED",
            "25.00",
            "USD",
        )

        self.assertIsNone(db.get_paypal_order("user-two", "ORDER123"))
        saved = db.get_paypal_order("user-one", "ORDER123")
        self.assertIsNotNone(saved)
        self.assertIsNone(saved["capture_id"])
        self.assertEqual(saved["status"], "CREATED")
        self.assertEqual(saved["amount"], "25.00")
        self.assertEqual(saved["currency"], "USD")
        self.assertIsNone(saved["capture_status"])
        self.assertTrue(saved["created_at"])
        self.assertTrue(saved["updated_at"])

        self.assertTrue(
            db.update_paypal_order(
                "user-one",
                "ORDER123",
                "COMPLETED",
                "CAPTURE123",
                "COMPLETED",
                "25.00",
                "USD",
            )
        )
        captured_order = db.get_paypal_order_by_capture_id(
            "user-one",
            "CAPTURE123",
        )
        self.assertEqual(captured_order["order_id"], "ORDER123")
        self.assertEqual(captured_order["status"], "COMPLETED")
        self.assertEqual(captured_order["capture_status"], "COMPLETED")
        self.assertIsNone(
            db.get_paypal_order_by_capture_id("user-two", "CAPTURE123")
        )

    def test_order_update_preserves_existing_capture_id(self):
        db.save_paypal_order(
            "user-one",
            "ORDER123",
            "APPROVED",
            "25.00",
            "USD",
        )
        db.update_paypal_order(
            "user-one",
            "ORDER123",
            "COMPLETED",
            "CAPTURE123",
            "COMPLETED",
        )

        self.assertTrue(db.update_paypal_order("user-one", "ORDER123", "COMPLETED"))
        saved = db.get_paypal_order("user-one", "ORDER123")
        self.assertEqual(saved["capture_id"], "CAPTURE123")
        self.assertEqual(saved["capture_status"], "COMPLETED")

    def test_existing_phase_one_table_is_migrated(self):
        with closing(sqlite3.connect(self.database_path)) as connection, connection:
            connection.execute(
                """
                CREATE TABLE paypal_orders (
                    order_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    capture_id TEXT,
                    status TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    currency TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                INSERT INTO paypal_orders
                    (order_id, user_id, status, amount, currency, created_at, updated_at)
                VALUES ('ORDER123', 'user-one', 'APPROVED', '25.00', 'USD', 'now', 'now')
                """
            )

        migrated = db.get_paypal_order("user-one", "ORDER123")

        self.assertIsNotNone(migrated)
        self.assertIsNone(migrated["capture_status"])


    def test_another_users_order_is_rejected_before_paypal_call(self):
        db.save_paypal_order(
            "owner",
            "ORDER123",
            "APPROVED",
            "25.00",
            "USD",
        )

        with patch(
            "app.api.paypal.PayPalService",
            side_effect=AssertionError("PayPal must not be called"),
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    capture_order(
                        current_user=AuthenticatedUser(id="different-user"),
                        order_id="ORDER123",
                    )
                )

        self.assertEqual(error.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
