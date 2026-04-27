from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from datetime import date
from pydantic import BaseModel
from app.database import get_db
from app.models.activo import Activo, EstadoActivo
from app.models.usuario import Usuario
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/activos", tags=["Activos"])


# ── Schemas inline (se moverán a schemas/ en siguientes fases) ──────────────

class ActivoCreate(BaseModel):
    nombre: str
    categoria_id: int
    codigo_interno: Optional[str] = None
    numero_serie: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion: Optional[int] = None
    color: Optional[str] = None
    descripcion: Optional[str] = None
    placa: Optional[str] = None
    km_actuales: Optional[int] = 0
    capacidad_litros: Optional[float] = None
    tipo_combustible: Optional[str] = None
    soat_vence: Optional[date] = None
    revision_tecnica_vence: Optional[date] = None
    seguro_vence: Optional[date] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    ubicacion_fisica: Optional[str] = None
    garantia_hasta: Optional[date] = None
    proveedor: Optional[str] = None
    numero_surtidor: Optional[str] = None
    proxima_calibracion: Optional[date] = None
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Optional[float] = None
    ubicacion: Optional[str] = None
    responsable_id: Optional[int] = None

    class Config:
        from_attributes = True


class ActivoUpdate(ActivoCreate):
    nombre: Optional[str] = None
    categoria_id: Optional[int] = None
    estado: Optional[EstadoActivo] = None
    km_actuales: Optional[int] = None


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/")
def listar_activos(
    empresa_id: Optional[int] = None,
    categoria_id: Optional[int] = None,
    estado: Optional[EstadoActivo] = None,
    buscar: Optional[str] = Query(None, description="Buscar por nombre, placa, código o IP"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista activos con filtros opcionales. Filtra por empresa del usuario si no es admin."""
    q = db.query(Activo).options(
        joinedload(Activo.categoria),
        joinedload(Activo.empresa)
    ).filter(Activo.activo == True)

    # Si no es admin, solo ve su empresa
    if current_user.rol != "admin" or empresa_id:
        eid = empresa_id or current_user.empresa_id
        q = q.filter(Activo.empresa_id == eid)

    if categoria_id:
        q = q.filter(Activo.categoria_id == categoria_id)

    if estado:
        q = q.filter(Activo.estado == estado)

    if buscar:
        term = f"%{buscar}%"
        q = q.filter(or_(
            Activo.nombre.ilike(term),
            Activo.placa.ilike(term),
            Activo.codigo_interno.ilike(term),
            Activo.ip_address.ilike(term),
            Activo.hostname.ilike(term),
        ))

    total = q.count()
    activos = q.order_by(Activo.nombre).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [_activo_to_dict(a) for a in activos]
    }


@router.get("/{activo_id}")
def obtener_activo(
    activo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Detalle de un activo con su historial de OTs."""
    activo = db.query(Activo).options(
        joinedload(Activo.categoria),
        joinedload(Activo.empresa),
        joinedload(Activo.ordenes_trabajo),
        joinedload(Activo.mantenimientos_prog),
    ).filter(Activo.id == activo_id).first()

    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    _check_empresa(activo.empresa_id, current_user)
    return _activo_to_dict(activo, detalle=True)


@router.post("/", status_code=201)
def crear_activo(
    data: ActivoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "supervisor"))
):
    """Crea un nuevo activo. Solo admin o supervisor."""
    activo = Activo(
        empresa_id=current_user.empresa_id,
        **data.model_dump(exclude_none=True)
    )
    db.add(activo)
    db.commit()
    db.refresh(activo)
    return {"mensaje": "Activo creado", "id": activo.id, "codigo": activo.codigo_interno}


@router.patch("/{activo_id}")
def actualizar_activo(
    activo_id: int,
    data: ActivoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "supervisor"))
):
    """Actualiza campos de un activo."""
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    _check_empresa(activo.empresa_id, current_user)

    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(activo, campo, valor)

    db.commit()
    db.refresh(activo)
    return {"mensaje": "Activo actualizado", "id": activo.id}


@router.patch("/{activo_id}/km")
def actualizar_km(
    activo_id: int,
    km: int = Query(..., ge=0, description="Kilometraje actual"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualiza el kilometraje de un vehículo/cisterna."""
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    if km < (activo.km_actuales or 0):
        raise HTTPException(status_code=400, detail="El km no puede ser menor al actual")

    activo.km_actuales = km
    db.commit()
    return {"mensaje": "KM actualizado", "km_actuales": km}


@router.delete("/{activo_id}")
def dar_de_baja(
    activo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin"))
):
    """Da de baja un activo (soft delete). Solo admin."""
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    activo.estado = EstadoActivo.dado_de_baja
    activo.activo = False
    db.commit()
    return {"mensaje": f"Activo '{activo.nombre}' dado de baja"}


# ── Helpers ─────────────────────────────────────────────────────────────────

def _check_empresa(empresa_id: int, user: Usuario):
    if user.rol != "admin" and user.empresa_id != empresa_id:
        raise HTTPException(status_code=403, detail="Sin acceso a este activo")


def _activo_to_dict(a: Activo, detalle: bool = False) -> dict:
    d = {
        "id": a.id,
        "empresa_id": a.empresa_id,
        "empresa": a.empresa.nombre if a.empresa else None,
        "categoria_id": a.categoria_id,
        "categoria": a.categoria.nombre if a.categoria else None,
        "categoria_icono": a.categoria.icono if a.categoria else None,
        "categoria_color": a.categoria.color if a.categoria else None,
        "nombre": a.nombre,
        "codigo_interno": a.codigo_interno,
        "marca": a.marca,
        "modelo": a.modelo,
        "numero_serie": a.numero_serie,
        "estado": a.estado,
        "placa": a.placa,
        "km_actuales": a.km_actuales,
        "ip_address": a.ip_address,
        "hostname": a.hostname,
        "ubicacion": a.ubicacion,
        "soat_vence": a.soat_vence,
        "revision_tecnica_vence": a.revision_tecnica_vence,
        "seguro_vence": a.seguro_vence,
        "proxima_calibracion": a.proxima_calibracion,
        "garantia_hasta": a.garantia_hasta,
        "created_at": a.created_at,
    }
    if detalle:
        d["descripcion"] = a.descripcion
        d["capacidad_litros"] = a.capacidad_litros
        d["tipo_combustible"] = a.tipo_combustible
        d["mac_address"] = a.mac_address
        d["proveedor"] = a.proveedor
        d["contrato_soporte"] = a.contrato_soporte
        d["costo_adquisicion"] = a.costo_adquisicion
        d["total_ots"] = len(a.ordenes_trabajo) if a.ordenes_trabajo else 0
    return d
