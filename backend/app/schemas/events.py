from uuid import UUID

from pydantic import BaseModel


class GuestSessionRead(BaseModel):
    id: UUID
    actor_type: str = "guest"

