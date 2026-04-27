from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import date, timedelta
from app.database import get_db
from app.models.activo import Activo, EstadoActivo
from app.models.orden_trabajo import OrdenTrabajo, EstadoOT
from app.models.alerta import Alerta
from app.models.usuario import Usuario
from app.core.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Retorna todas las métricas del dashboard en una sola llamada.
    Filtra por empresa del usuario.
    """
    eid = current_user.empresa_id

    # ── Activos por estado ──────────────────────────────────────────────────
    estados_activos = (
        db.query(Activo.estado, func.count(Activo.id))
        .filter(Activo.empresa_id == eid, Activo.activo == True)
        .group_by(Activo.estado)
        .all()
    )
    activos_resumen = {e.value: 0 for e in EstadoActivo}
    for estado, cnt in estados_activos:
        activos_resumen[estado.value] = cnt
    activos_resumen["total"] = sum(activos_resumen.values())

    # ── OTs del mes actual ──────────────────────────────────────────────────
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    estados_ot = (
        db.query(OrdenTrabajo.estado, func.count(OrdenTrabajo.id))
        .filter(
            OrdenTrabajo.empresa_id == eid,
            func.date(OrdenTrabajo.fecha_solicitud) >= inicio_mes
        )
        .group_by(OrdenTrabajo.estado)
        .all()
    )
    ots_mes = {e.value: 0 for e in EstadoOT}
    for estado, cnt in estados_ot:
        ots_mes[estado.value] = cnt

    # ── Costo total del mes ─────────────────────────────────────────────────
    costo_mes = (
        db.query(
            func.coalesce(func.sum(OrdenTrabajo.costo_mano_obra), 0) +
            func.coalesce(func.sum(OrdenTrabajo.costo_repuestos), 0)
        )
        .filter(
            OrdenTrabajo.empresa_id == eid,
            OrdenTrabajo.estado == EstadoOT.completada,
            func.date(OrdenTrabajo.fecha_fin) >= inicio_mes
        )
        .scalar() or 0
    )

    # ── Alertas sin leer ────────────────────────────────────────────────────
    alertas_activas = (
        db.query(Alerta)
        .filter(
            Alerta.empresa_id == eid,
            Alerta.resuelta == False,
            Alerta.leida == False
        )
        .order_by(Alerta.fecha_alerta.asc())
        .limit(10)
        .all()
    )

    # ── Próximos mantenimientos (vista SQL) ─────────────────────────────────
    proximos = db.execute(
        text("""
            SELECT activo, codigo_interno, placa, mantenimiento,
                   tipo, proxima_ejecucion, dias_restantes, semaforo
            FROM v_proximos_mantenimientos
            WHERE empresa_id = :eid
            LIMIT 10
        """),
        {"eid": eid}
    ).fetchall()

    # ── OTs pendientes sin asignar ──────────────────────────────────────────
    ots_sin_asignar = (
        db.query(func.count(OrdenTrabajo.id))
        .filter(
            OrdenTrabajo.empresa_id == eid,
            OrdenTrabajo.estado == EstadoOT.pendiente,
            OrdenTrabajo.tecnico_asignado_id == None
        )
        .scalar() or 0
    )

    return {
        "activos": activos_resumen,
        "ots_mes": {**ots_mes, "total": sum(ots_mes.values())},
        "costo_mes_bs": float(costo_mes),
        "alertas_sin_leer": len(alertas_activas),
        "ots_sin_asignar": ots_sin_asignar,
        "alertas": [
            {
                "id": a.id,
                "tipo": a.tipo,
                "titulo": a.titulo,
                "prioridad": a.prioridad,
                "fecha_alerta": a.fecha_alerta,
            }
            for a in alertas_activas
        ],
        "proximos_mantenimientos": [
            {
                "activo": r.activo,
                "codigo": r.codigo_interno,
                "placa": r.placa,
                "mantenimiento": r.mantenimiento,
                "tipo": r.tipo,
                "proxima": r.proxima_ejecucion,
                "dias_restantes": r.dias_restantes,
                "semaforo": r.semaforo,
            }
            for r in proximos
        ],
        "fecha_consulta": hoy.isoformat(),
    }
