from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from app.config import settings
from app.database import Base, engine
from app.routers import auth, activos, ordenes, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Se ejecuta al arrancar. Crea tablas si no existen."""
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"✓ {settings.APP_NAME} v{settings.APP_VERSION} iniciado")
    yield
    print("✗ Servidor detenido")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para gestión de mantenimiento de activos — IMCLA Bolivia / Volcán S.R.L.",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router,       prefix=PREFIX)
app.include_router(activos.router,    prefix=PREFIX)
app.include_router(ordenes.router,    prefix=PREFIX)
app.include_router(dashboard.router,  prefix=PREFIX)

# ── Archivos estáticos (uploads) ─────────────────────────────────────────────
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ── Health check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# ── Endpoints disponibles (útil para debug) ─────────────────────────────────
@app.get("/api/v1/endpoints", tags=["Sistema"])
def listar_endpoints():
    return [
        {"path": r.path, "metodos": list(r.methods)}
        for r in app.routes
        if hasattr(r, "methods")
    ]
