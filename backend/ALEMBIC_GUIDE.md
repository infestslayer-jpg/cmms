# Alembic - Gestión de migraciones de base de datos
# =====================================================
# Uso básico:
#
#   Inicializar (solo una vez):
#     alembic init alembic
#
#   Crear migración automática tras cambios en modelos:
#     alembic revision --autogenerate -m "descripcion del cambio"
#
#   Aplicar migraciones pendientes:
#     alembic upgrade head
#
#   Ver historial:
#     alembic history
#
#   Revertir último cambio:
#     alembic downgrade -1
# =====================================================

# env.py de Alembic debe importar Base y la DATABASE_URL:
#
# from app.database import Base
# from app.models import *  # importar todos los modelos
# from app.config import settings
# config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
# target_metadata = Base.metadata
