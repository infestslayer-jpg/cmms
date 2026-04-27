from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    Enum, ForeignKey, Numeric, SmallInteger, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class EstadoActivo(str, enum.Enum):
    operativo          = "operativo"
    en_mantenimiento   = "en_mantenimiento"
    fuera_de_servicio  = "fuera_de_servicio"
    dado_de_baja       = "dado_de_baja"


class Activo(Base):
    __tablename__ = "activos"

    id                     = Column(Integer, primary_key=True, index=True)
    empresa_id             = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    categoria_id           = Column(Integer, ForeignKey("categorias_activo.id"), nullable=False)

    # Identificación general
    nombre                 = Column(String(150), nullable=False)
    codigo_interno         = Column(String(50), unique=True)
    numero_serie           = Column(String(100))
    marca                  = Column(String(100))
    modelo                 = Column(String(100))
    anio_fabricacion       = Column(SmallInteger)
    color                  = Column(String(50))
    estado                 = Column(Enum(EstadoActivo), default=EstadoActivo.operativo, index=True)
    descripcion            = Column(String(500))
    foto_url               = Column(String(500))

    # Vehículos / Cisternas
    placa                  = Column(String(20), index=True)
    km_actuales            = Column(Integer, default=0)
    km_siguiente_mant      = Column(Integer)
    capacidad_litros       = Column(Numeric(10, 2))
    tipo_combustible       = Column(String(50))

    # Documentos legales vehículos
    soat_vence             = Column(Date)
    revision_tecnica_vence = Column(Date)
    seguro_vence           = Column(Date)
    permiso_operacion_vence= Column(Date)

    # Red / IT
    ip_address             = Column(String(15), index=True)
    mac_address            = Column(String(17))
    hostname               = Column(String(100))
    vlan                   = Column(String(20))
    ubicacion_fisica       = Column(String(200))

    # Garantía
    garantia_hasta         = Column(Date)
    proveedor              = Column(String(150))
    contrato_soporte       = Column(String(200))
    telefono_soporte       = Column(String(50))

    # Dispensadoras
    numero_surtidor        = Column(String(20))
    ultima_calibracion     = Column(Date)
    proxima_calibracion    = Column(Date)

    # Control general
    fecha_adquisicion      = Column(Date)
    costo_adquisicion      = Column(Numeric(12, 2))
    ubicacion              = Column(String(200))
    responsable_id         = Column(Integer, ForeignKey("usuarios.id"))
    activo                 = Column(Boolean, default=True)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())
    updated_at             = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    empresa                = relationship("Empresa", back_populates="activos")
    categoria              = relationship("CategoriaActivo", back_populates="activos")
    responsable            = relationship("Usuario", foreign_keys=[responsable_id])
    ordenes_trabajo        = relationship("OrdenTrabajo", back_populates="activo")
    mantenimientos_prog    = relationship("MantenimientoProgramado", back_populates="activo")
    alertas                = relationship("Alerta", back_populates="activo")
