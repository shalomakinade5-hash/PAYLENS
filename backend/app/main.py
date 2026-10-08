import logging
import os

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import api_router
from app.models.errors import TransactionNotFoundError

app = FastAPI(title="PayLens API", version="0.2.0")
logger = logging.getLogger("paylens.api")

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in frontend_origins if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(TransactionNotFoundError)
async def transaction_not_found_handler(_, error: TransactionNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "error": {"code": "transaction_not_found", "message": str(error)}
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_, error: StarletteHTTPException):
    message = str(error.detail)
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {"code": "http_error", "message": message}},
        headers=error.headers,
    )


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_, error: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "The request did not match the expected format.",
                "details": jsonable_encoder(error.errors()),
            }
        },
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(_, error: Exception):
    logger.error(
        "Unhandled API exception",
        exc_info=(type(error), error, error.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected server error occurred.",
            }
        },
    )


app.include_router(api_router)
