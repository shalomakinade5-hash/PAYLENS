class TransactionNotFoundError(Exception):
    def __init__(self, transaction_id: str):
        super().__init__(f"Transaction '{transaction_id}' was not found.")
