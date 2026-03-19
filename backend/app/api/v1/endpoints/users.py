import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserRoleUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[UserRead]:
    records = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [UserRead.model_validate(record) for record in records]


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdateRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User topilmadi.")

    user.role = payload.role
    db.commit()
    db.refresh(user)

    # Admin o'z rolini bekor qilsa, joriy tokenida eski claim qoladi.
    # Shu sabab frontend refresh-token orqali yangi token olishi kerak bo'ladi.
    _ = admin_user
    return UserRead.model_validate(user)
