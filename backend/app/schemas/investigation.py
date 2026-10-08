from pydantic import BaseModel, Field


class InvestigationRequest(BaseModel):
    transaction_id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=5, max_length=500)


class InvestigationResponse(BaseModel):
    transaction_id: str
    question: str
    headline: str
    summary: str
    evidence: list[str]
    suggested_next_step: str
    provider: str = "mock"
    is_mock: bool = True
