from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.auth import router as auth_router
from app.api.routes.works import router as works_router
from app.api.routes.timer import router as timer_router
from app.api.routes.reports import router as reports_router

app = FastAPI(title="Worklog API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(works_router)
app.include_router(timer_router)
app.include_router(reports_router)

@app.get("/health")
def health():
    return {"ok": True}
