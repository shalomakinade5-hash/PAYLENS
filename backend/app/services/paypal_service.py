import os
from dataclasses import dataclass
from decimal import Decimal
from urllib.parse import quote, urlsplit
from uuid import NAMESPACE_URL, uuid4, uuid5

import httpx


SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com"
DEFAULT_RETURN_URL = "http://127.0.0.1:5173/dashboard/recovery"


class PayPalIntegrationError(Exception):
    pass


@dataclass(frozen=True)
class PayPalConfiguration:
    client_id: str | None
    client_secret: str | None
    base_url: str
    return_url: str | None

    @classmethod
    def from_environment(cls) -> "PayPalConfiguration":
        configured_base_url = os.getenv("PAYPAL_BASE_URL", SANDBOX_BASE_URL).rstrip("/")
        return cls(
            client_id=os.getenv("PAYPAL_CLIENT_ID") or None,
            client_secret=os.getenv("PAYPAL_CLIENT_SECRET") or None,
            base_url=configured_base_url,
            return_url=os.getenv("PAYPAL_RETURN_URL") or DEFAULT_RETURN_URL,
        )

    @property
    def is_configured(self) -> bool:
        return self.is_api_configured

    @property
    def is_api_configured(self) -> bool:
        return bool(
            self.client_id
            and self.client_secret
            and self.base_url == SANDBOX_BASE_URL
        )

    def validate_api_configuration(self) -> None:
        if not self.is_api_configured:
            raise PayPalIntegrationError(
                "PayPal Sandbox API credentials are not configured."
            )

    def validate(self) -> None:
        self.validate_api_configuration()
        if not self.return_url:
            raise PayPalIntegrationError(
                "A PayPal Sandbox return URL is not configured."
            )
        parsed_return_url = urlsplit(self.return_url)
        if parsed_return_url.scheme not in {"http", "https"} or not parsed_return_url.netloc:
            raise PayPalIntegrationError(
                "The PayPal Sandbox return URL is invalid."
            )


@dataclass(frozen=True)
class PayPalOrderDetails:
    order_id: str
    status: str
    amount: str
    currency: str
    capture_id: str | None = None
    capture_status: str | None = None


@dataclass(frozen=True)
class PayPalCaptureDetails:
    capture_id: str
    status: str
    amount: str
    currency: str


class PayPalService:
    def __init__(
        self,
        configuration: PayPalConfiguration | None = None,
        client: httpx.AsyncClient | None = None,
    ):
        self.configuration = configuration or PayPalConfiguration.from_environment()
        self.client = client

    async def check_api_connection(self) -> None:
        await self._get_app_access_token()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        access_token: str,
        **kwargs,
    ) -> dict:
        client = self.client or httpx.AsyncClient(timeout=15)
        should_close = self.client is None
        request_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        request_headers.update(kwargs.pop("headers", {}))
        try:
            response = await client.request(
                method,
                f"{self.configuration.base_url}{path}",
                headers=request_headers,
                **kwargs,
            )
            if response.is_error:
                raise PayPalIntegrationError(
                    f"PayPal Sandbox returned HTTP {response.status_code}."
                )
            payload = response.json()
            if not isinstance(payload, dict):
                raise PayPalIntegrationError(
                    "PayPal Sandbox returned an invalid response."
                )
            return payload
        except httpx.HTTPError as error:
            raise PayPalIntegrationError(
                "Could not reach PayPal Sandbox."
            ) from error
        except ValueError as error:
            raise PayPalIntegrationError(
                "PayPal Sandbox returned an invalid response."
            ) from error
        finally:
            if should_close:
                await client.aclose()

    async def _get_app_access_token(self) -> str:
        self.configuration.validate_api_configuration()
        client = self.client or httpx.AsyncClient(timeout=15)
        should_close = self.client is None
        try:
            response = await client.post(
                f"{self.configuration.base_url}/v1/oauth2/token",
                auth=(
                    self.configuration.client_id,
                    self.configuration.client_secret,
                ),
                data={"grant_type": "client_credentials"},
                headers={"Accept": "application/json"},
            )
            if response.is_error:
                safe_error_codes = {
                    "invalid_client",
                    "invalid_grant",
                    "invalid_request",
                    "unauthorized_client",
                    "unsupported_grant_type",
                }
                try:
                    error_payload = response.json()
                except ValueError:
                    error_payload = {}
                error_code = (
                    error_payload.get("error")
                    if isinstance(error_payload, dict)
                    else None
                )
                safe_code = (
                    f" ({error_code})"
                    if isinstance(error_code, str)
                    and error_code in safe_error_codes
                    else ""
                )
                raise PayPalIntegrationError(
                    f"PayPal Sandbox OAuth returned HTTP "
                    f"{response.status_code}{safe_code}."
                )
            payload = response.json()
            access_token = (
                payload.get("access_token")
                if isinstance(payload, dict)
                else None
            )
            if not isinstance(access_token, str) or not access_token:
                raise PayPalIntegrationError(
                    "PayPal Sandbox did not return an application access token."
                )
            return access_token
        except httpx.HTTPError as error:
            raise PayPalIntegrationError(
                "Could not reach PayPal Sandbox OAuth."
            ) from error
        except ValueError as error:
            raise PayPalIntegrationError(
                "PayPal Sandbox OAuth returned an invalid response."
            ) from error
        finally:
            if should_close:
                await client.aclose()

    async def create_order(
        self,
        amount: Decimal,
        currency: str,
    ) -> tuple[PayPalOrderDetails, str]:
        self.configuration.validate()
        access_token = await self._get_app_access_token()
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": f"{amount:.2f}",
                    }
                }
            ],
            "application_context": {
                "return_url": self.configuration.return_url,
                "cancel_url": self.configuration.return_url,
            },
        }
        response = await self._request(
            "POST",
            "/v2/checkout/orders",
            access_token=access_token,
            json=payload,
            headers={"PayPal-Request-Id": str(uuid4())},
        )
        order_id = response.get("id")
        status = response.get("status")
        action_url = next(
            (
                link.get("href")
                for link in response.get("links", [])
                if link.get("rel") in {"approve", "payer-action"}
            ),
            None,
        )
        parsed_action = urlsplit(action_url) if isinstance(action_url, str) else None
        if (
            not isinstance(order_id, str)
            or not order_id
            or not isinstance(status, str)
            or parsed_action is None
            or parsed_action.scheme != "https"
            or parsed_action.hostname != "www.sandbox.paypal.com"
        ):
            raise PayPalIntegrationError(
                "PayPal Sandbox did not return a valid order and approval link."
            )
        return (
            PayPalOrderDetails(
                order_id=order_id,
                status=status,
                amount=f"{amount:.2f}",
                currency=currency,
            ),
            action_url,
        )

    async def get_order(self, order_id: str) -> PayPalOrderDetails:
        self.configuration.validate_api_configuration()
        access_token = await self._get_app_access_token()
        response = await self._request(
            "GET",
            f"/v2/checkout/orders/{quote(order_id, safe='')}",
            access_token=access_token,
        )
        return self._order_details(response)

    async def capture_order(self, order_id: str) -> PayPalOrderDetails:
        self.configuration.validate_api_configuration()
        access_token = await self._get_app_access_token()
        response = await self._request(
            "POST",
            f"/v2/checkout/orders/{quote(order_id, safe='')}/capture",
            access_token=access_token,
            json={},
            headers={
                "PayPal-Request-Id": str(
                    uuid5(NAMESPACE_URL, f"paylens-paypal-capture:{order_id}")
                )
            },
        )
        return self._order_details(response)

    async def get_capture(self, capture_id: str) -> PayPalCaptureDetails:
        self.configuration.validate_api_configuration()
        access_token = await self._get_app_access_token()
        response = await self._request(
            "GET",
            f"/v2/payments/captures/{quote(capture_id, safe='')}",
            access_token=access_token,
        )
        returned_capture_id = response.get("id")
        status = response.get("status")
        amount = response.get("amount")
        if (
            not isinstance(returned_capture_id, str)
            or not isinstance(status, str)
            or not isinstance(amount, dict)
            or not isinstance(amount.get("value"), str)
            or not isinstance(amount.get("currency_code"), str)
        ):
            raise PayPalIntegrationError(
                "PayPal Sandbox returned an invalid capture response."
            )
        return PayPalCaptureDetails(
            capture_id=returned_capture_id,
            status=status,
            amount=amount["value"],
            currency=amount["currency_code"],
        )

    @staticmethod
    def _order_details(response: dict) -> PayPalOrderDetails:
        order_id = response.get("id")
        status = response.get("status")
        purchase_units = response.get("purchase_units")
        if (
            not isinstance(order_id, str)
            or not isinstance(status, str)
            or not isinstance(purchase_units, list)
            or not purchase_units
            or not isinstance(purchase_units[0], dict)
        ):
            raise PayPalIntegrationError(
                "PayPal Sandbox returned an invalid order response."
            )
        amount = purchase_units[0].get("amount")
        if (
            not isinstance(amount, dict)
            or not isinstance(amount.get("value"), str)
            or not isinstance(amount.get("currency_code"), str)
        ):
            raise PayPalIntegrationError(
                "PayPal Sandbox returned an invalid order amount."
            )
        payments = purchase_units[0].get("payments")
        captures = payments.get("captures") if isinstance(payments, dict) else None
        capture_id = None
        capture_status = None
        if isinstance(captures, list) and captures and isinstance(captures[0], dict):
            candidate_capture_id = captures[0].get("id")
            if isinstance(candidate_capture_id, str):
                capture_id = candidate_capture_id
            candidate_capture_status = captures[0].get("status")
            if isinstance(candidate_capture_status, str):
                capture_status = candidate_capture_status
        return PayPalOrderDetails(
            order_id=order_id,
            status=status,
            amount=amount["value"],
            currency=amount["currency_code"],
            capture_id=capture_id,
            capture_status=capture_status,
        )
