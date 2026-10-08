import logging
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field

from app import db
from app.auth import CurrentUser
from app.services.paypal_service import (
    PayPalIntegrationError,
    PayPalOrderDetails,
    PayPalService,
)

router = APIRouter(prefix="/paypal", tags=["paypal"])
logger = logging.getLogger("paylens.paypal")


class PayPalConnectionStatus(BaseModel):
    configured: bool
    connected: bool
    mode: str = "sandbox"
    status: str
    error: str | None = None


class PayPalCreateOrderRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    currency: str = Field(pattern=r"^[A-Z]{3}$")


class PayPalCreateOrderResponse(BaseModel):
    order_id: str
    approval_url: str
    status: str
    amount: str
    currency: str


class PayPalOrderResponse(BaseModel):
    order_id: str
    capture_id: str | None = None
    status: str
    capture_status: str | None = None
    amount: str
    currency: str


class PayPalCaptureResponse(BaseModel):
    order_id: str
    capture_id: str
    order_status: str
    capture_status: str
    amount: str
    currency: str


@router.get("/status", response_model=PayPalConnectionStatus)
async def get_connection_status(current_user: CurrentUser) -> PayPalConnectionStatus:
    del current_user
    service = PayPalService()
    connected = False
    error_message = None
    try:
        await service.check_api_connection()
        connected = True
    except PayPalIntegrationError as error:
        logger.warning("PayPal Sandbox authentication check failed: %s", error)
        error_message = str(error)

    return PayPalConnectionStatus(
        configured=service.configuration.is_configured,
        connected=connected,
        mode="sandbox",
        status="available" if connected else "not_configured",
        error=error_message,
    )


@router.post("/orders", response_model=PayPalCreateOrderResponse)
async def create_order(
    request: PayPalCreateOrderRequest,
    current_user: CurrentUser,
) -> PayPalCreateOrderResponse:
    service = PayPalService()
    try:
        order, approval_url = await service.create_order(
            request.amount,
            request.currency,
        )
    except PayPalIntegrationError as error:
        if not service.configuration.is_configured:
            raise HTTPException(status_code=503, detail=str(error)) from error
        logger.warning("PayPal Sandbox order creation failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail=f"PayPal Sandbox could not create the order: {error}",
        ) from error

    db.save_paypal_order(
        current_user.id,
        order.order_id,
        order.status,
        order.amount,
        order.currency,
    )
    return PayPalCreateOrderResponse(
        order_id=order.order_id,
        approval_url=approval_url,
        status=order.status,
        amount=order.amount,
        currency=order.currency,
    )


@router.get("/orders/{order_id}", response_model=PayPalOrderResponse)
async def get_order(
    current_user: CurrentUser,
    order_id: str = Path(pattern=r"^[A-Za-z0-9-]{1,64}$"),
) -> PayPalOrderResponse:
    stored_order = db.get_paypal_order(current_user.id, order_id)
    if not stored_order:
        raise HTTPException(
            status_code=404,
            detail="No PayPal Sandbox order was found for this PayLens account.",
        )

    service = PayPalService()
    try:
        order = await service.get_order(order_id)
    except PayPalIntegrationError as error:
        logger.warning("PayPal Sandbox order lookup failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail=f"PayPal Sandbox could not retrieve the order: {error}",
        ) from error
    if order.order_id != order_id:
        raise HTTPException(
            status_code=502,
            detail="PayPal Sandbox returned an unexpected order.",
        )
    db.update_paypal_order(
        current_user.id,
        order_id,
        order.status,
        order.capture_id,
        order.capture_status,
        order.amount,
        order.currency,
    )
    return _order_response(order)


@router.post(
    "/orders/{order_id}/capture",
    response_model=PayPalCaptureResponse,
)
async def capture_order(
    current_user: CurrentUser,
    order_id: str = Path(pattern=r"^[A-Za-z0-9-]{1,64}$"),
) -> PayPalCaptureResponse:
    stored_order = db.get_paypal_order(current_user.id, order_id)
    if not stored_order:
        raise HTTPException(
            status_code=404,
            detail="No PayPal Sandbox order was found for this PayLens account.",
        )

    service = PayPalService()
    try:
        order = await service.get_order(order_id)
        if order.order_id != order_id:
            raise HTTPException(
                status_code=502,
                detail="PayPal Sandbox returned an unexpected order.",
            )

        if order.status == "COMPLETED" and order.capture_id:
            capture = await service.get_capture(order.capture_id)
        elif order.status == "APPROVED":
            order = await service.capture_order(order_id)
            if order.order_id != order_id:
                raise HTTPException(
                    status_code=502,
                    detail="PayPal Sandbox returned an unexpected order.",
                )
            if not order.capture_id:
                raise HTTPException(
                    status_code=502,
                    detail="PayPal Sandbox completed the order without returning a capture ID.",
                )
            capture = await service.get_capture(order.capture_id)
        else:
            db.update_paypal_order(
                current_user.id,
                order_id,
                order.status,
                order.capture_id,
                order.capture_status,
                order.amount,
                order.currency,
            )
            raise HTTPException(
                status_code=409,
                detail=(
                    "The PayPal Sandbox order must be approved before it can be "
                    f"captured. Its current status is {order.status}."
                ),
            )
    except PayPalIntegrationError as error:
        logger.warning("PayPal Sandbox order capture failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail=f"PayPal Sandbox could not capture the order: {error}",
        ) from error

    if capture.capture_id != order.capture_id:
        raise HTTPException(
            status_code=502,
            detail="PayPal Sandbox returned an unexpected capture.",
        )
    db.update_paypal_order(
        current_user.id,
        order_id,
        order.status,
        capture.capture_id,
        capture.status,
        capture.amount,
        capture.currency,
    )
    return PayPalCaptureResponse(
        order_id=order_id,
        capture_id=capture.capture_id,
        order_status=order.status,
        capture_status=capture.status,
        amount=capture.amount,
        currency=capture.currency,
    )


@router.get("/captures/{capture_id}", response_model=PayPalCaptureResponse)
async def get_capture(
    current_user: CurrentUser,
    capture_id: str = Path(pattern=r"^[A-Za-z0-9-]{1,64}$"),
) -> PayPalCaptureResponse:
    stored_order = db.get_paypal_order_by_capture_id(current_user.id, capture_id)
    if not stored_order:
        raise HTTPException(
            status_code=404,
            detail="No PayPal Sandbox capture was found for this PayLens account.",
        )

    service = PayPalService()
    try:
        capture = await service.get_capture(capture_id)
    except PayPalIntegrationError as error:
        logger.warning("PayPal Sandbox capture lookup failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail=f"PayPal Sandbox could not retrieve the capture: {error}",
        ) from error
    if capture.capture_id != capture_id:
        raise HTTPException(
            status_code=502,
            detail="PayPal Sandbox returned an unexpected capture.",
        )
    db.update_paypal_order(
        current_user.id,
        stored_order["order_id"],
        stored_order["status"],
        capture.capture_id,
        capture.status,
        capture.amount,
        capture.currency,
    )
    return PayPalCaptureResponse(
        order_id=stored_order["order_id"],
        capture_id=capture.capture_id,
        order_status=stored_order["status"],
        capture_status=capture.status,
        amount=capture.amount,
        currency=capture.currency,
    )


def _order_response(order: PayPalOrderDetails) -> PayPalOrderResponse:
    return PayPalOrderResponse(
        order_id=order.order_id,
        capture_id=order.capture_id,
        status=order.status,
        capture_status=order.capture_status,
        amount=order.amount,
        currency=order.currency,
    )
