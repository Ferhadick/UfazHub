from datetime import datetime

from pydantic import BaseModel


class FeedItem(BaseModel):
    id: str
    kind: str
    title: str
    description: str
    href: str
    author_name: str
    author_username: str
    tags: list[str]
    score: int
    meta: str
    created_at: datetime
