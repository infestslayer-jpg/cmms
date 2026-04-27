from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id           = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(150), nullable=False)
    razon_social = Column(String(200))
    nit          = Column(String(20))
    direccion    = Column(String(300))
    telefono     = Column(String(50))
    email        = Column(String(100))
    logo_url     = Column(String(500))
    activa       = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    activos      = relationship("Activo", back_populates="empresa")
    usuarios     = relationship("Usuario", back_populates="empresa")
    ordenes      = relationship("OrdenTrabajo", back_populates="empresa")
