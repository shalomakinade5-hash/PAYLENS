from datetime import datetime

from pydantic import BaseModel

from app.models.transaction import OpportunityPriority


class RecoveryOpportunity(BaseModel):
    opportunity_id: str
    transaction_id: str
    customer_name: str
    amount: float
    currency: str
    reason: str
    status: str
    priority: OpportunityPriority
    identified_at: datetime
    is_demo: bool = True
