from fastapi import APIRouter

from app.api import ai, health, paypal, recovery, transactions

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(transactions.router)
api_router.include_router(recovery.router)
api_router.include_router(ai.router)
api_router.include_router(paypal.router)
