from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GameRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    desc: str
    players: str
    level: str
    duration: str
    category: str
    tone: str
    is_active: bool
    order_index: int
    created_at: datetime
    updated_at: datetime
