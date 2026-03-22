from typing import Any

import firebase_admin
import httpx
from firebase_admin import auth, credentials

from app.core.config import settings


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
        return auth.verify_id_token(id_token)
    except Exception:
        if not settings.firebase_web_api_key:
            raise

        response = httpx.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={settings.firebase_web_api_key}",
            json={"idToken": id_token},
            timeout=15.0,
        )
        response.raise_for_status()
        payload = response.json()
        users = payload.get("users") or []
        if not users:
            raise ValueError("Firebase foydalanuvchi topilmadi.")

        user = users[0]
        return {
            "uid": user.get("localId"),
            "email": user.get("email"),
            "name": user.get("displayName"),
            "picture": user.get("photoUrl"),
        }
