from fastapi import APIRouter

from app.auth import CurrentUser
from app.schemas.investigation import (
    InvestigationRequest,
    InvestigationResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/investigate", response_model=InvestigationResponse)
def investigate(
    request: InvestigationRequest,
    current_user: CurrentUser,
) -> InvestigationResponse:
    return ai_service.investigate(request.transaction_id, request.question)
