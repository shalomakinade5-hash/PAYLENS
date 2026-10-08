from datetime import datetime, timedelta, timezone

from app.models.errors import TransactionNotFoundError
from app.models.transaction import TransactionStatus
from app.schemas.transactions import (
    TransactionDetail,
    TransactionEvent,
    TransactionSummary,
)


def _transaction(
    transaction_id: str,
    order_reference: str,
    customer_name: str,
    amount: float,
    currency: str,
    status: TransactionStatus,
    created_at: datetime,
    failure_code: str | None = None,
    failure_message: str | None = None,
) -> TransactionDetail:
    start = created_at - timedelta(minutes=4)
    timeline = [
        TransactionEvent(
            event="Checkout started",
            detail=f"Demo order {order_reference} entered checkout.",
            occurred_at=start,
            kind="started",
        ),
        TransactionEvent(
            event="Payment attempt",
            detail="A sample payment attempt was recorded.",
            occurred_at=created_at - timedelta(minutes=1),
            kind="attempt",
        ),
        TransactionEvent(
            event=status.value.title(),
            detail=failure_message
            or f"Sample transaction status: {status.value}.",
            occurred_at=created_at,
            kind=status.value,
        ),
    ]
    return TransactionDetail(
        transaction_id=transaction_id,
        order_reference=order_reference,
        customer_name=customer_name,
        amount=amount,
        currency=currency,
        status=status,
        created_at=created_at,
        payment_method="PayPal (demo only)",
        failure_code=failure_code,
        failure_message=failure_message,
        timeline=timeline,
    )


_DEMO_TRANSACTIONS = [
    _transaction(
        "PL-2849",
        "ORD-10482",
        "Maya Chen",
        284.00,
        "USD",
        TransactionStatus.FAILED,
        datetime(2026, 10, 2, 15, 42, tzinfo=timezone.utc),
        "INSTRUMENT_DECLINED",
        "The sample funding source declined the payment.",
    ),
    _transaction(
        "PL-2848",
        "ORD-10481",
        "Oliver Grant",
        96.50,
        "USD",
        TransactionStatus.ABANDONED,
        datetime(2026, 10, 2, 15, 16, tzinfo=timezone.utc),
    ),
    _transaction(
        "PL-2847",
        "ORD-10480",
        "Sofia Patel",
        1240.00,
        "USD",
        TransactionStatus.SUCCEEDED,
        datetime(2026, 10, 1, 13, 5, tzinfo=timezone.utc),
    ),
    _transaction(
        "PL-2846",
        "ORD-10479",
        "Noah Williams",
        58.00,
        "USD",
        TransactionStatus.FAILED,
        datetime(2026, 9, 30, 17, 30, tzinfo=timezone.utc),
        "PAYMENT_DENIED",
        "The sample payment was declined by its funding source.",
    ),
    _transaction(
        "PL-2845",
        "ORD-10478",
        "Harper Kim",
        342.00,
        "EUR",
        TransactionStatus.ABANDONED,
        datetime(2026, 9, 29, 11, 18, tzinfo=timezone.utc),
    ),
    _transaction(
        "PL-2844",
        "ORD-10477",
        "Amara Okafor",
        780.00,
        "USD",
        TransactionStatus.SUCCEEDED,
        datetime(2026, 9, 28, 9, 44, tzinfo=timezone.utc),
    ),
    _transaction(
        "PL-2843",
        "ORD-10476",
        "Julian Rivera",
        119.00,
        "GBP",
        TransactionStatus.SUCCEEDED,
        datetime(2026, 9, 27, 16, 21, tzinfo=timezone.utc),
    ),
    _transaction(
        "PL-2842",
        "ORD-10475",
        "Grace Liu",
        460.00,
        "USD",
        TransactionStatus.PENDING,
        datetime(2026, 10, 3, 8, 12, tzinfo=timezone.utc),
    ),
]


def list_transaction_details() -> list[TransactionDetail]:
    return list(_DEMO_TRANSACTIONS)


def list_transactions(
    search: str | None = None,
    status: TransactionStatus | None = None,
) -> list[TransactionSummary]:
    normalized_search = search.strip().casefold() if search else ""
    matching = []
    ordered_transactions = sorted(
        _DEMO_TRANSACTIONS,
        key=lambda item: item.created_at,
        reverse=True,
    )
    for transaction in ordered_transactions:
        if status and transaction.status != status:
            continue
        searchable = " ".join(
            (
                transaction.transaction_id,
                transaction.order_reference,
                transaction.customer_name,
                transaction.status.value,
            )
        ).casefold()
        if normalized_search and normalized_search not in searchable:
            continue
        matching.append(
            TransactionSummary.model_validate(
                transaction.model_dump(exclude={"timeline"})
            )
        )
    return matching


def get_transaction(transaction_id: str) -> TransactionDetail:
    for transaction in _DEMO_TRANSACTIONS:
        if transaction.transaction_id.casefold() == transaction_id.casefold():
            return transaction
    raise TransactionNotFoundError(transaction_id)
