from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CategoriaActivo(Base):
    __tablename__ = "categorias_activo"

    id            = Column(Integer, primary_key=True)
    nombre        = Column(String(100), nullable=False)
    descripcion   = Column(String(300))
    icono         = Column(String(50))
    color         = Column(String(7))
    requiere_km   = Column(Boolean, default=False)
    requiere_ip   = Column(Boolean, default=False)
    activa        = Column(Boolean, default=True)

    activos       = relationship("Activo", back_populates="categoria")
    plantillas    = relationship("ChecklistPlantilla", back_populates="categoria")


class ChecklistPlantilla(Base):
    __tablename__ = "checklist_plantillas"

    id            = Column(Integer, primary_key=True)
    categoria_id  = Column(Integer, ForeignKey("categorias_activo.id"))
    empresa_id    = Column(Integer, ForeignKey("empresas.id"))
    nombre        = Column(String(150), nullable=False)
    descripcion   = Column(String(300))
    tipo_mant     = Column(String(20))
    activa        = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    categoria     = relationship("CategoriaActivo", back_populates="plantillas")
    items         = relationship("ChecklistItemPlantilla", back_populates="plantilla",
                                 cascade="all, delete-orphan", order_by="ChecklistItemPlantilla.orden")


class ChecklistItemPlantilla(Base):
    __tablename__ = "checklist_items_plantilla"

    id             = Column(Integer, primary_key=True)
    plantilla_id   = Column(Integer, ForeignKey("checklist_plantillas.id", ondelete="CASCADE"), nullable=False)
    orden          = Column(SmallInteger, nullable=False)
    descripcion    = Column(String(300), nullable=False)
    tipo_respuesta = Column(String(20), default="si_no")
    obligatorio    = Column(Boolean, default=True)
    unidad         = Column(String(30))
    valor_min      = Column(Numeric(10, 2))
    valor_max      = Column(Numeric(10, 2))

    plantilla      = relationship("ChecklistPlantilla", back_populates="items")
