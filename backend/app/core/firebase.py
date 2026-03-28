from typing import Any

import firebase_admin
import httpx
from firebase_admin import auth, credentials
from jose import JWTError, jwt

from app.core.config import settings


def _normalize_decoded_token(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    normalized["uid"] = str(
        payload.get("uid")
        or payload.get("user_id")
        or payload.get("sub")
        or "",
    )
    normalized["email"] = str(payload.get("email") or "").strip().lower()
    normalized["name"] = payload.get("name") or payload.get("displayName")
    normalized["picture"] = payload.get("picture") or payload.get("photoUrl")
    return normalized


def _initialize_firebase_app() -> None:
    if firebase_admin._apps:
        return

    options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None

    if settings.firebase_credentials_path:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        if options:
            firebase_admin.initialize_app(cred, options)
        else:
            firebase_admin.initialize_app(cred)
        return

    if options:
        firebase_admin.initialize_app(options=options)
        return

    firebase_admin.initialize_app()


def verify_firebase_id_token(id_token: str) -> dict[str, Any]:
    try:
        _initialize_firebase_app()
        return _normalize_decoded_token(auth.verify_id_token(id_token, clock_skew_seconds=60))
    except Exception:
        project_id = settings.firebase_project_id
        if project_id:
            try:
                headers = jwt.get_unverified_header(id_token)
                key_id = headers.get("kid")
                certs_response = httpx.get(
                    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
                    timeout=15.0,
                )
                certs_response.raise_for_status()
                certs = certs_response.json()
                public_key = certs.get(key_id)
                if public_key:
                    return _normalize_decoded_token(
                        jwt.decode(
                            id_token,
                            public_key,
                            algorithms=["RS256"],
                            audience=project_id,
                            issuer=f"https://securetoken.google.com/{project_id}",
                        ),
                    )
            except (JWTError, ValueError, httpx.HTTPError):
                pass

        if settings.firebase_web_api_key:
            try:
                response = httpx.post(
                    f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={settings.firebase_web_api_key}",
                    json={"idToken": id_token},
                    timeout=15.0,
                )
                response.raise_for_status()
                payload = response.json()
                users = payload.get("users") or []
                if users:
                    user = users[0]
                    return _normalize_decoded_token(
                        {
                            "uid": user.get("localId"),
                            "email": user.get("email"),
                            "name": user.get("displayName"),
                            "picture": user.get("photoUrl"),
                        },
                    )
            except httpx.HTTPError:
                pass

        raise
