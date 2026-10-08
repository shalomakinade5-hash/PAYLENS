import os
from functools import lru_cache
from typing import Annotated
from urllib.error import URLError

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient, PyJWKClientError
from jwt.exceptions import PyJWKClientConnectionError
from pydantic import BaseModel, ValidationError


class AuthenticatedUser(BaseModel):
    id: str
    email: str | None = None


@lru_cache(maxsize=1)
def _get_jwks_client(supabase_url: str) -> PyJWKClient:
    return PyJWKClient(
        f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
        cache_keys=True,
        timeout=5,
    )


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        raise HTTPException(
            status_code=503,
            detail="Authentication is not configured on this server.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    try:
        signing_key = _get_jwks_client(supabase_url).get_signing_key_from_jwt(
            token
        )
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=f"{supabase_url}/auth/v1",
        )
        return AuthenticatedUser.model_validate(
            {"id": claims.get("sub"), "email": claims.get("email")}
        )
    except (PyJWKClientConnectionError, URLError, OSError) as error:
        raise HTTPException(
            status_code=503,
            detail="The authentication provider could not be reached.",
        ) from error
    except (jwt.PyJWTError, PyJWKClientError, ValidationError):
        raise HTTPException(
            status_code=401,
            detail="The authentication session is invalid or has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
