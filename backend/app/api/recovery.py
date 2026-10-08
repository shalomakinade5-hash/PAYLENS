from fastapi import APIRouter

from app.auth import CurrentUser
from app.schemas.recovery import RecoveryOpportunity
from app.services import recovery_service

router = APIRouter(prefix="/recovery-opportunities", tags=["recovery"])


@router.get("", response_model=list[RecoveryOpportunity])
def list_recovery_opportunities(
    current_user: CurrentUser,
) -> list[RecoveryOpportunity]:
    return recovery_service.list_opportunities()
