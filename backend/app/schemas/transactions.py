from datetime import datetime

from pydantic import BaseModel

from app.models.transaction import TransactionStatus


class TransactionSummary(BaseModel):
    transaction_id: str
    order_reference: str
    customer_name: str
    amount: float
    currency: str
    status: TransactionStatus
    created_at: datetime
    payment_method: str
    failure_code: str | None = None
    failure_message: str | None = None
    is_demo: bool = True


class TransactionEvent(BaseModel):
    event: str
    detail: str
    occurred_at: datetime
    kind: str


class TransactionDetail(TransactionSummary):
    timeline: list[TransactionEvent]
