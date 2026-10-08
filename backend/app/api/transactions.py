from fastapi import APIRouter, Query

from app.auth import CurrentUser
from app.models.transaction import TransactionStatus
from app.schemas.transactions import TransactionDetail, TransactionSummary
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionSummary])
def list_transactions(
    current_user: CurrentUser,
    search: str | None = Query(default=None, max_length=100),
    status: TransactionStatus | None = None,
) -> list[TransactionSummary]:
    return transaction_service.list_transactions(search=search, status=status)


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction(
    transaction_id: str,
    current_user: CurrentUser,
) -> TransactionDetail:
    return transaction_service.get_transaction(transaction_id)
