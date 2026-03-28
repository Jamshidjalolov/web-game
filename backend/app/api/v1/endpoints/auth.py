import uuid
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.firebase import verify_firebase_id_token
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    FirebaseLoginRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
)
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserRead.model_validate(user),
    )


def _normalize_email(email: str) -> str:
    cleaned = email.strip().lower()
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    if not re.match(pattern, cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email formati noto'g'ri.",
        )
    return cleaned


def _resolve_new_user_role(email: str) -> UserRole:
    return UserRole.ADMIN if email in settings.admin_emails else UserRole.TEACHER


def _resolve_existing_user_role(user: User, email: str) -> UserRole:
    if email in settings.admin_emails:
        return UserRole.ADMIN
    return user.role


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        email = _normalize_email(payload.email)
        full_name = payload.full_name.strip() if payload.full_name else None
        password_hash = hash_password(payload.password)
        role = _resolve_new_user_role(email)

        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                firebase_uid=f"local:{uuid.uuid4().hex}",
                email=email,
                full_name=full_name,
                role=role,
                password_hash=password_hash,
            )
            db.add(user)
        else:
            if user.password_hash:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Bu email bilan akkaunt allaqachon mavjud.",
                )
            user.password_hash = password_hash
            user.full_name = full_name or user.full_name
            user.role = role
            if not user.firebase_uid:
                user.firebase_uid = f"local:{uuid.uuid4().hex}"

        db.commit()
        db.refresh(user)
        return _build_auth_response(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB tayyor emas. `alembic upgrade head` bajarib, backendni qayta ishga tushiring.",
        ) from exc


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        email = _normalize_email(payload.email)
        user = db.scalar(select(User).where(User.email == email))
        if user is None or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email yoki parol noto'g'ri.",
            )

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email yoki parol noto'g'ri.",
            )

        expected_role = _resolve_existing_user_role(user, email)
        if user.role != expected_role:
            user.role = expected_role
            db.commit()
            db.refresh(user)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akkaunt bloklangan.",
            )

        return _build_auth_response(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB tayyor emas. `alembic upgrade head` bajarib, backendni qayta ishga tushiring.",
        ) from exc


@router.post("/firebase-login", response_model=AuthResponse)
def firebase_login(payload: FirebaseLoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    try:
        decoded = verify_firebase_id_token(payload.id_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token tasdiqlanmadi.",
        ) from exc

    firebase_uid = str(decoded.get("uid") or "")
    email = str(decoded.get("email") or "").strip().lower()
    full_name = str(decoded.get("name") or "").strip() or None
    photo_url = str(decoded.get("picture") or "").strip() or None

    if not firebase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token ichida uid yoki email yo'q.",
        )

    try:
        user = db.scalar(
            select(User).where(
                (User.firebase_uid == firebase_uid) | (User.email == email),
            ),
        )

        if user is None:
            role = _resolve_new_user_role(email)
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                full_name=full_name,
                photo_url=photo_url,
                role=role,
            )
            db.add(user)
        else:
            user.firebase_uid = firebase_uid
            user.email = email
            user.full_name = full_name or user.full_name
            user.photo_url = photo_url or user.photo_url
            user.role = _resolve_existing_user_role(user, email)

        db.commit()
        db.refresh(user)
        return _build_auth_response(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB tayyor emas. `alembic upgrade head` bajarib, backendni qayta ishga tushiring.",
        ) from exc


@router.post("/refresh", response_model=AuthResponse)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> AuthResponse:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token yaroqsiz.",
    )
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError:
        raise unauthorized

    if token_payload.get("type") != "refresh":
        raise unauthorized

    try:
        user_id = uuid.UUID(str(token_payload.get("sub")))
    except (TypeError, ValueError):
        raise unauthorized

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized

    return _build_auth_response(user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
