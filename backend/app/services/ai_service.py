from app.schemas.investigation import InvestigationResponse
from app.services import transaction_service


def investigate(transaction_id: str, question: str) -> InvestigationResponse:
    transaction = transaction_service.get_transaction(transaction_id)
    if transaction.failure_message:
        headline = "A sample funding-source decline is recorded."
        summary = (
            f"This demo transaction is marked {transaction.status.value}. "
            f"Its sample failure detail is: {transaction.failure_message}"
        )
        evidence = [
            f"Status: {transaction.status.value}",
            f"Sample failure code: "
            f"{transaction.failure_code or 'not provided'}",
            f"Amount: {transaction.amount:.2f} {transaction.currency}",
        ]
        next_step = (
            "Review the payment details. PayLens has not "
            "contacted the customer or retried the payment."
        )
    elif transaction.status.value == "abandoned":
        headline = "The sample checkout ended before payment completion."
        summary = (
            "The demo record has no processor decline reason because no "
            "completed payment attempt is recorded."
        )
        evidence = [
            "Status: abandoned",
            f"Amount: {transaction.amount:.2f} {transaction.currency}",
            "No failure code is present in this demo record.",
        ]
        next_step = (
            "Review the order context. No recovery message or payment retry "
            "has been initiated."
        )
    else:
        headline = (
            f"This sample payment is currently {transaction.status.value}."
        )
        summary = (
            "The demo record does not contain a failed payment signal to "
            "explain."
        )
        evidence = [
            f"Status: {transaction.status.value}",
            f"Amount: {transaction.amount:.2f} {transaction.currency}",
        ]
        next_step = (
            "Review the transaction timeline before taking any action outside "
            "PayLens."
        )

    return InvestigationResponse(
        transaction_id=transaction.transaction_id,
        question=question,
        headline=headline,
        summary=summary,
        evidence=evidence,
        suggested_next_step=next_step,
    )
