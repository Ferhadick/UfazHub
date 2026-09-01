import enum


class ResourceType(str, enum.Enum):
    course = "course"
    article = "article"
    video = "video"
    docs = "docs"
    github_repo = "github_repo"
    website = "website"
    book = "book"


class Difficulty(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class ArticleStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class ActorType(str, enum.Enum):
    guest = "guest"
    user = "user"


class ActionEventType(str, enum.Enum):
    view_resource = "view_resource"
    view_article = "view_article"
    view_collection = "view_collection"
    view_profile = "view_profile"
    search_query = "search_query"
    vote_attempt_blocked = "vote_attempt_blocked"
    submit_attempt_blocked = "submit_attempt_blocked"
    vote_cast = "vote_cast"
    resource_created = "resource_created"
    article_published = "article_published"
    collection_created = "collection_created"
    signup_started = "signup_started"
    signup_completed = "signup_completed"
    login = "login"

