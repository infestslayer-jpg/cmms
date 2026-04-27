# Importar todos los modelos aquí para que SQLAlchemy y Alembic
# los detecten automáticamente al generar migraciones

from app.models.empresa import Empresa
from app.models.usuario import Usuario, RolUsuario
from app.models.activo import Activo, EstadoActivo
from app.models.orden_trabajo import OrdenTrabajo, TipoMantenimiento, EstadoOT, PrioridadOT
from app.models.catalogo import CategoriaActivo, ChecklistPlantilla, ChecklistItemPlantilla
from app.models.checklist import ChecklistRespuesta
from app.models.repuesto import RepuestoCatalogo, OtRepuesto
from app.models.adjunto import Adjunto
from app.models.programado import MantenimientoProgramado
from app.models.alerta import Alerta

__all__ = [
    "Empresa", "Usuario", "RolUsuario",
    "Activo", "EstadoActivo",
    "OrdenTrabajo", "TipoMantenimiento", "EstadoOT", "PrioridadOT",
    "CategoriaActivo", "ChecklistPlantilla", "ChecklistItemPlantilla",
    "ChecklistRespuesta", "RepuestoCatalogo", "OtRepuesto",
    "Adjunto", "MantenimientoProgramado", "Alerta",
]
