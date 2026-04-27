from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class RolUsuario(str, enum.Enum):
    admin        = "admin"
    supervisor   = "supervisor"
    tecnico      = "tecnico"
    solo_lectura = "solo_lectura"


class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(Integer, primary_key=True, index=True)
    empresa_id    = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    nombre        = Column(String(100), nullable=False)
    apellido      = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol           = Column(Enum(RolUsuario), default=RolUsuario.tecnico)
    telefono      = Column(String(50))
    activo        = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    empresa       = relationship("Empresa", back_populates="usuarios")
    ordenes_asignadas = relationship(
        "OrdenTrabajo",
        back_populates="tecnico_asignado",
        foreign_keys="OrdenTrabajo.tecnico_asignado_id"
    )

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"
