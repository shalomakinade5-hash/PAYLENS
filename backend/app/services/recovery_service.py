from app.models.transaction import OpportunityPriority, TransactionStatus
from app.schemas.recovery import RecoveryOpportunity
from app.services.transaction_service import list_transaction_details


def list_opportunities() -> list[RecoveryOpportunity]:
    opportunities = []
    for transaction in list_transaction_details():
        if transaction.status not in (
            TransactionStatus.FAILED,
            TransactionStatus.ABANDONED,
        ):
            continue
        if transaction.status == TransactionStatus.FAILED:
            reason = transaction.failure_message or (
                "Payment failed during the sample checkout."
            )
        else:
            reason = (
                "Checkout was started but the sample payment was not "
                "completed."
            )
        opportunities.append(
            RecoveryOpportunity(
                opportunity_id=(
                    f"OPP-{transaction.transaction_id.removeprefix('PL-')}"
                ),
                transaction_id=transaction.transaction_id,
                customer_name=transaction.customer_name,
                amount=transaction.amount,
                currency=transaction.currency,
                reason=reason,
                status="Needs review",
                priority=(
                    OpportunityPriority.HIGH
                    if transaction.amount >= 300
                    else OpportunityPriority.STANDARD
                ),
                identified_at=transaction.created_at,
            )
        )
    return opportunities
