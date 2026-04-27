from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    Enum, ForeignKey, Numeric, SmallInteger, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


# ── Checklist respuestas ───────────────────────────────────────────────────

class ChecklistRespuesta(Base):
    __tablename__ = "checklist_respuestas"

    id              = Column(Integer, primary_key=True)
    ot_id           = Column(Integer, ForeignKey("ordenes_trabajo.id", ondelete="CASCADE"), nullable=False)
    item_id         = Column(Integer, ForeignKey("checklist_items_plantilla.id"))
    orden           = Column(SmallInteger)
    descripcion     = Column(String(300), nullable=False)
    respuesta_bool  = Column(Boolean)
    respuesta_num   = Column(Numeric(10, 2))
    respuesta_texto = Column(Text)
    foto_url        = Column(String(500))
    observacion     = Column(String(300))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    orden_trabajo   = relationship("OrdenTrabajo", back_populates="checklist_respuestas")


# ── Repuestos ──────────────────────────────────────────────────────────────

class RepuestoCatalogo(Base):
    __tablename__ = "repuestos_catalogo"

    id              = Column(Integer, primary_key=True)
    empresa_id      = Column(Integer, ForeignKey("empresas.id"))
    codigo          = Column(String(50))
    nombre          = Column(String(150), nullable=False)
    descripcion     = Column(String(300))
    unidad          = Column(String(30))
    precio_unitario = Column(Numeric(10, 2))
    stock_actual    = Column(Integer, default=0)
    stock_minimo    = Column(Integer, default=0)
    proveedor       = Column(String(150))
    activo          = Column(Boolean, default=True)

    usos            = relationship("OtRepuesto", back_populates="repuesto")


class OtRepuesto(Base):
    __tablename__ = "ot_repuestos"

    id              = Column(Integer, primary_key=True)
    ot_id           = Column(Integer, ForeignKey("ordenes_trabajo.id", ondelete="CASCADE"), nullable=False)
    repuesto_id     = Column(Integer, ForeignKey("repuestos_catalogo.id"))
    descripcion     = Column(String(200), nullable=False)
    cantidad        = Column(Numeric(10, 2), nullable=False)
    precio_unitario = Column(Numeric(10, 2))

    orden_trabajo   = relationship("OrdenTrabajo", back_populates="repuestos")
    repuesto        = relationship("RepuestoCatalogo", back_populates="usos")

    @property
    def subtotal(self) -> float:
        return float(self.cantidad or 0) * float(self.precio_unitario or 0)


# ── Adjuntos ───────────────────────────────────────────────────────────────

class TipoAdjunto(str, enum.Enum):
    foto      = "foto"
    pdf       = "pdf"
    video     = "video"
    documento = "documento"
    otro      = "otro"


class Adjunto(Base):
    __tablename__ = "adjuntos"

    id              = Column(Integer, primary_key=True)
    ot_id           = Column(Integer, ForeignKey("ordenes_trabajo.id", ondelete="CASCADE"))
    activo_id       = Column(Integer, ForeignKey("activos.id", ondelete="CASCADE"))
    tipo            = Column(Enum(TipoAdjunto), default=TipoAdjunto.foto)
    nombre_archivo  = Column(String(255), nullable=False)
    url             = Column(String(500), nullable=False)
    tamano_bytes    = Column(Integer)
    subido_por_id   = Column(Integer, ForeignKey("usuarios.id"))
    descripcion     = Column(String(300))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    orden_trabajo   = relationship("OrdenTrabajo", back_populates="adjuntos")


# ── Mantenimientos programados ─────────────────────────────────────────────

class FrecuenciaTipo(str, enum.Enum):
    dias    = "dias"
    semanas = "semanas"
    meses   = "meses"
    km      = "km"
    horas   = "horas"


class MantenimientoProgramado(Base):
    __tablename__ = "mantenimientos_programados"

    id                = Column(Integer, primary_key=True)
    empresa_id        = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    activo_id         = Column(Integer, ForeignKey("activos.id"), nullable=False)
    plantilla_id      = Column(Integer, ForeignKey("checklist_plantillas.id"))

    nombre            = Column(String(200), nullable=False)
    descripcion       = Column(String(500))
    tipo              = Column(String(20), default="preventivo")

    frecuencia_valor  = Column(Integer, nullable=False)
    frecuencia_tipo   = Column(Enum(FrecuenciaTipo), nullable=False)
    frecuencia_km     = Column(Integer)

    ultima_ejecucion  = Column(Date)
    proxima_ejecucion = Column(Date, nullable=False, index=True)
    km_proxima        = Column(Integer)

    dias_anticipacion = Column(Integer, default=7)
    km_anticipacion   = Column(Integer, default=500)

    activo            = Column(Boolean, default=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    activo_rel        = relationship("Activo", back_populates="mantenimientos_prog")


# ── Alertas ────────────────────────────────────────────────────────────────

class TipoAlerta(str, enum.Enum):
    mantenimiento_proximo        = "mantenimiento_proximo"
    mantenimiento_vencido        = "mantenimiento_vencido"
    soat_por_vencer              = "soat_por_vencer"
    revision_tecnica_por_vencer  = "revision_tecnica_por_vencer"
    seguro_por_vencer            = "seguro_por_vencer"
    calibracion_por_vencer       = "calibracion_por_vencer"
    garantia_por_vencer          = "garantia_por_vencer"
    stock_minimo                 = "stock_minimo"
    ot_sin_atender               = "ot_sin_atender"


class Alerta(Base):
    __tablename__ = "alertas"

    id              = Column(Integer, primary_key=True)
    empresa_id      = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    activo_id       = Column(Integer, ForeignKey("activos.id"))
    programado_id   = Column(Integer, ForeignKey("mantenimientos_programados.id"))
    ot_id           = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    tipo            = Column(Enum(TipoAlerta), nullable=False)
    titulo          = Column(String(200), nullable=False)
    mensaje         = Column(Text)
    prioridad       = Column(String(10), default="media")
    leida           = Column(Boolean, default=False, index=True)
    resuelta        = Column(Boolean, default=False)
    fecha_alerta    = Column(Date, nullable=False, index=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    activo          = relationship("Activo", back_populates="alertas")
