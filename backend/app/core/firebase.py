from typing import Any

import firebase_admin
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
    _initialize_firebase_app()
    return auth.verify_id_token(id_token)
