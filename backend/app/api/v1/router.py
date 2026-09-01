from fastapi import APIRouter

from app.api.v1 import articles, auth, collections, feed, guest, profile, resources, search, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(guest.router)
api_router.include_router(feed.router)
api_router.include_router(resources.router)
api_router.include_router(articles.router)
api_router.include_router(collections.router)
api_router.include_router(search.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
