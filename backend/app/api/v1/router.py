from fastapi import APIRouter

from app.api.v1 import admin, admin_qa, articles, auth, collections, feed, guest, profile, qa, resources, search, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(guest.router)
api_router.include_router(feed.router)
api_router.include_router(resources.router)
api_router.include_router(articles.router)
api_router.include_router(collections.router)
api_router.include_router(qa.router)
api_router.include_router(search.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(admin.router)
api_router.include_router(admin_qa.router)
