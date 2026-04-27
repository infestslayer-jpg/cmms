from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # verifica conexión antes de usar
    pool_size=10,             # conexiones simultáneas
    max_overflow=20,          # conexiones extra bajo carga
    echo=settings.DEBUG,      # loguea SQL solo en modo debug
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency de FastAPI. Abre una sesión de BD por request
    y la cierra automáticamente al terminar.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
