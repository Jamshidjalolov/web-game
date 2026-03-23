from fastapi import APIRouter

from app.api.v1.endpoints import auth, game_comments, games, questions, users, visual_iq_rankings

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(game_comments.router)
api_router.include_router(games.router)
api_router.include_router(questions.router)
api_router.include_router(users.router)
api_router.include_router(visual_iq_rankings.router)
