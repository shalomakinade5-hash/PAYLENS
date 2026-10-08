from enum import Enum


class TransactionStatus(str, Enum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    ABANDONED = "abandoned"
    PENDING = "pending"


class OpportunityPriority(str, Enum):
    HIGH = "high"
    STANDARD = "standard"
