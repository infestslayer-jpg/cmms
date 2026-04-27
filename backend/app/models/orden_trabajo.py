from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum, ForeignKey, Numeric, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class TipoMantenimiento(str, enum.Enum):
    preventivo  = "preventivo"
    correctivo  = "correctivo"
    predictivo  = "predictivo"
    emergencia  = "emergencia"


class EstadoOT(str, enum.Enum):
    pendiente   = "pendiente"
    en_proceso  = "en_proceso"
    completada  = "completada"
    cancelada   = "cancelada"
    rechazada   = "rechazada"


class PrioridadOT(str, enum.Enum):
    baja    = "baja"
    media   = "media"
    alta    = "alta"
    critica = "critica"


class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"

    id                  = Column(Integer, primary_key=True, index=True)
    empresa_id          = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    activo_id           = Column(Integer, ForeignKey("activos.id"), nullable=False)
    plantilla_id        = Column(Integer, ForeignKey("checklist_plantillas.id"))

    numero_ot           = Column(String(20), unique=True, index=True)
    tipo                = Column(Enum(TipoMantenimiento), nullable=False)
    prioridad           = Column(Enum(PrioridadOT), default=PrioridadOT.media)
    estado              = Column(Enum(EstadoOT), default=EstadoOT.pendiente, index=True)

    titulo              = Column(String(200), nullable=False)
    descripcion         = Column(Text)
    observaciones       = Column(Text)
    solucion_aplicada   = Column(Text)
    km_al_momento       = Column(Integer)

    solicitado_por_id   = Column(Integer, ForeignKey("usuarios.id"))
    tecnico_asignado_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    supervisor_id       = Column(Integer, ForeignKey("usuarios.id"))

    fecha_solicitud     = Column(DateTime(timezone=True), server_default=func.now())
    fecha_programada    = Column(DateTime(timezone=True), index=True)
    fecha_inicio        = Column(DateTime(timezone=True))
    fecha_fin           = Column(DateTime(timezone=True))
    fecha_limite        = Column(DateTime(timezone=True))
    duracion_minutos    = Column(Integer)

    costo_mano_obra     = Column(Numeric(10, 2), default=0)
    costo_repuestos     = Column(Numeric(10, 2), default=0)

    firma_tecnico       = Column(String(500))
    firma_supervisor    = Column(String(500))
    aprobada            = Column(Boolean, default=False)
    fecha_aprobacion    = Column(DateTime(timezone=True))

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    empresa             = relationship("Empresa", back_populates="ordenes")
    activo              = relationship("Activo", back_populates="ordenes_trabajo")
    tecnico_asignado    = relationship(
        "Usuario",
        back_populates="ordenes_asignadas",
        foreign_keys=[tecnico_asignado_id]
    )
    checklist_respuestas = relationship("ChecklistRespuesta", back_populates="orden_trabajo",
                                        cascade="all, delete-orphan")
    repuestos           = relationship("OtRepuesto", back_populates="orden_trabajo",
                                       cascade="all, delete-orphan")
    adjuntos            = relationship("Adjunto", back_populates="orden_trabajo")

    @property
    def costo_total(self) -> float:
        return float(self.costo_mano_obra or 0) + float(self.costo_repuestos or 0)
