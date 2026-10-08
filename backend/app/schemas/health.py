from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    data_mode: str
    integrations: dict[str, str]
