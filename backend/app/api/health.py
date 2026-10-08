from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="paylens-api",
        data_mode="demo",
        integrations={"paypal": "not_configured", "ai_analysis": "mock"},
    )
