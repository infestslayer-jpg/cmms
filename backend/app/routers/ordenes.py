from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models.orden_trabajo import OrdenTrabajo, EstadoOT, TipoMantenimiento, PrioridadOT
from app.models.activo import Activo, EstadoActivo
from app.models.usuario import Usuario
from app.core.security import get_current_user, require_roles

router = APIRouter(prefix="/ordenes", tags=["Órdenes de trabajo"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class OTCreate(BaseModel):
    activo_id: int
    tipo: TipoMantenimiento
    prioridad: PrioridadOT = PrioridadOT.media
    titulo: str
    descripcion: Optional[str] = None
    tecnico_asignado_id: Optional[int] = None
    fecha_programada: Optional[datetime] = None
    fecha_limite: Optional[datetime] = None
    plantilla_id: Optional[int] = None
    km_al_momento: Optional[int] = None


class OTCerrar(BaseModel):
    solucion_aplicada: str
    observaciones: Optional[str] = None
    costo_mano_obra: float = 0
    costo_repuestos: float = 0
    duracion_minutos: Optional[int] = None
    firma_tecnico: Optional[str] = None


class RepuestoUsado(BaseModel):
    descripcion: str
    cantidad: float
    precio_unitario: float
    repuesto_id: Optional[int] = None


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/")
def listar_ordenes(
    empresa_id: Optional[int] = None,
    activo_id: Optional[int] = None,
    estado: Optional[EstadoOT] = None,
    tipo: Optional[TipoMantenimiento] = None,
    tecnico_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    q = db.query(OrdenTrabajo).options(
        joinedload(OrdenTrabajo.activo),
        joinedload(OrdenTrabajo.tecnico_asignado),
    )

    # Técnico solo ve sus propias OTs
    if current_user.rol == "tecnico":
        q = q.filter(OrdenTrabajo.tecnico_asignado_id == current_user.id)
    else:
        eid = empresa_id or current_user.empresa_id
        q = q.filter(OrdenTrabajo.empresa_id == eid)

    if activo_id:
        q = q.filter(OrdenTrabajo.activo_id == activo_id)
    if estado:
        q = q.filter(OrdenTrabajo.estado == estado)
    if tipo:
        q = q.filter(OrdenTrabajo.tipo == tipo)
    if tecnico_id:
        q = q.filter(OrdenTrabajo.tecnico_asignado_id == tecnico_id)

    total = q.count()
    ordenes = q.order_by(OrdenTrabajo.fecha_solicitud.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "data": [_ot_to_dict(o) for o in ordenes]
    }


@router.get("/{ot_id}")
def obtener_orden(
    ot_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    ot = db.query(OrdenTrabajo).options(
        joinedload(OrdenTrabajo.activo),
        joinedload(OrdenTrabajo.tecnico_asignado),
        joinedload(OrdenTrabajo.checklist_respuestas),
        joinedload(OrdenTrabajo.repuestos),
        joinedload(OrdenTrabajo.adjuntos),
    ).filter(OrdenTrabajo.id == ot_id).first()

    if not ot:
        raise HTTPException(status_code=404, detail="OT no encontrada")

    return _ot_to_dict(ot, detalle=True)


@router.post("/", status_code=201)
def crear_orden(
    data: OTCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crea una nueva OT y cambia el estado del activo a 'en_mantenimiento'."""
    activo = db.query(Activo).filter(Activo.id == data.activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    ot = OrdenTrabajo(
        empresa_id=current_user.empresa_id,
        solicitado_por_id=current_user.id,
        **data.model_dump(exclude_none=True)
    )
    db.add(ot)

    # Si es urgente/emergencia, marcar activo en mantenimiento
    if data.tipo == TipoMantenimiento.emergencia or data.prioridad == PrioridadOT.critica:
        activo.estado = EstadoActivo.en_mantenimiento

    db.commit()
    db.refresh(ot)
    return {"mensaje": "OT creada", "id": ot.id, "numero_ot": ot.numero_ot}


@router.patch("/{ot_id}/iniciar")
def iniciar_orden(
    ot_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Técnico inicia la OT — cambia estado a 'en_proceso'."""
    ot = _get_ot_or_404(ot_id, db)
    if ot.estado != EstadoOT.pendiente:
        raise HTTPException(status_code=400, detail=f"No se puede iniciar una OT en estado '{ot.estado}'")

    ot.estado = EstadoOT.en_proceso
    ot.fecha_inicio = datetime.utcnow()
    ot.tecnico_asignado_id = ot.tecnico_asignado_id or current_user.id

    # Marcar activo en mantenimiento
    if ot.activo:
        ot.activo.estado = EstadoActivo.en_mantenimiento

    db.commit()
    return {"mensaje": "OT iniciada", "numero_ot": ot.numero_ot}


@router.patch("/{ot_id}/cerrar")
def cerrar_orden(
    ot_id: int,
    data: OTCerrar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Cierra la OT con la solución aplicada y devuelve el activo a operativo."""
    ot = _get_ot_or_404(ot_id, db)
    if ot.estado not in [EstadoOT.pendiente, EstadoOT.en_proceso]:
        raise HTTPException(status_code=400, detail="OT no está en estado cerrable")

    ot.estado = EstadoOT.completada
    ot.fecha_fin = datetime.utcnow()
    ot.solucion_aplicada = data.solucion_aplicada
    ot.observaciones = data.observaciones
    ot.costo_mano_obra = data.costo_mano_obra
    ot.costo_repuestos = data.costo_repuestos
    ot.duracion_minutos = data.duracion_minutos
    ot.firma_tecnico = data.firma_tecnico

    if data.duracion_minutos is None and ot.fecha_inicio:
        delta = datetime.utcnow() - ot.fecha_inicio.replace(tzinfo=None)
        ot.duracion_minutos = int(delta.total_seconds() / 60)

    # Devolver activo a operativo
    if ot.activo:
        ot.activo.estado = EstadoActivo.operativo

    db.commit()
    return {
        "mensaje": "OT completada",
        "numero_ot": ot.numero_ot,
        "costo_total": ot.costo_total,
        "duracion_minutos": ot.duracion_minutos
    }


@router.patch("/{ot_id}/cancelar")
def cancelar_orden(
    ot_id: int,
    motivo: str = Query(..., min_length=5),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "supervisor"))
):
    ot = _get_ot_or_404(ot_id, db)
    ot.estado = EstadoOT.cancelada
    ot.observaciones = motivo
    if ot.activo and ot.activo.estado == EstadoActivo.en_mantenimiento:
        ot.activo.estado = EstadoActivo.operativo
    db.commit()
    return {"mensaje": "OT cancelada"}


# ── Helpers ─────────────────────────────────────────────────────────────────

def _get_ot_or_404(ot_id: int, db: Session) -> OrdenTrabajo:
    ot = db.query(OrdenTrabajo).options(
        joinedload(OrdenTrabajo.activo)
    ).filter(OrdenTrabajo.id == ot_id).first()
    if not ot:
        raise HTTPException(status_code=404, detail="OT no encontrada")
    return ot


def _ot_to_dict(ot: OrdenTrabajo, detalle: bool = False) -> dict:
    d = {
        "id": ot.id,
        "numero_ot": ot.numero_ot,
        "tipo": ot.tipo,
        "prioridad": ot.prioridad,
        "estado": ot.estado,
        "titulo": ot.titulo,
        "activo_id": ot.activo_id,
        "activo": ot.activo.nombre if ot.activo else None,
        "activo_placa": ot.activo.placa if ot.activo else None,
        "tecnico": ot.tecnico_asignado.nombre_completo if ot.tecnico_asignado else None,
        "fecha_solicitud": ot.fecha_solicitud,
        "fecha_programada": ot.fecha_programada,
        "fecha_fin": ot.fecha_fin,
        "costo_total": ot.costo_total,
    }
    if detalle:
        d["descripcion"] = ot.descripcion
        d["solucion_aplicada"] = ot.solucion_aplicada
        d["observaciones"] = ot.observaciones
        d["costo_mano_obra"] = ot.costo_mano_obra
        d["costo_repuestos"] = ot.costo_repuestos
        d["duracion_minutos"] = ot.duracion_minutos
        d["km_al_momento"] = ot.km_al_momento
        d["checklist"] = [
            {
                "orden": r.orden,
                "descripcion": r.descripcion,
                "respuesta_bool": r.respuesta_bool,
                "respuesta_num": r.respuesta_num,
                "respuesta_texto": r.respuesta_texto,
                "observacion": r.observacion,
            }
            for r in (ot.checklist_respuestas or [])
        ]
        d["repuestos"] = [
            {
                "descripcion": r.descripcion,
                "cantidad": r.cantidad,
                "precio_unitario": r.precio_unitario,
                "subtotal": r.subtotal,
            }
            for r in (ot.repuestos or [])
        ]
    return d
