import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from prelegal.config import get_settings
from prelegal.database.engine import engine
from prelegal.database.init_db import init_db
from prelegal.routers import health, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(engine)
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

app.include_router(health.router)
app.include_router(chat.router)

_settings = get_settings()
if os.path.isdir(_settings.static_files_dir):
    app.mount("/", StaticFiles(directory=_settings.static_files_dir, html=True), name="static")
