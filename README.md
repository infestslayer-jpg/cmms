# CMMS - Sistema de Gestión de Mantenimiento
## IMCLA Bolivia / Estación de Servicios Volcán S.R.L.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend API | Python 3.11 + FastAPI |
| ORM | SQLAlchemy 2.0 |
| Base de datos | PostgreSQL 14+ |
| Autenticación | JWT (python-jose) |
| Servidor | Ubuntu 24.04 / Nginx / Gunicorn |
| Frontend | React + Tailwind (Fase 2) |

---

## Estructura del repositorio

```
cmms-imcla-volcan/
├── backend/
│   ├── app/
│   │   ├── main.py           ← Entrada FastAPI
│   │   ├── config.py         ← Variables de entorno
│   │   ├── database.py       ← Conexión PostgreSQL
│   │   ├── core/
│   │   │   └── security.py   ← JWT, auth, roles
│   │   ├── models/           ← Modelos SQLAlchemy
│   │   ├── routers/          ← Endpoints REST
│   │   ├── schemas/          ← Validación Pydantic
│   │   └── services/         ← Lógica de negocio
│   ├── requirements.txt
│   ├── .env.example
│   └── deploy_setup.sh
├── database/
│   └── cmms_schema.sql
└── README.md
```

---

## Instalación local (desarrollo)

```bash
# 1. Clonar repositorio
git clone https://github.com/TU_USUARIO/cmms-imcla-volcan.git
cd cmms-imcla-volcan/backend

# 2. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de BD

# 5. Crear la BD y aplicar schema
createdb cmms_db
psql cmms_db < ../database/cmms_schema.sql

# 6. Arrancar el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/api/docs

---

## Endpoints principales

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Login, retorna JWT |
| GET  | `/api/v1/auth/me` | Datos del usuario actual |

### Activos
| Método | Ruta | Descripción |
|---|---|---|
| GET    | `/api/v1/activos/` | Listar con filtros |
| GET    | `/api/v1/activos/{id}` | Detalle + historial |
| POST   | `/api/v1/activos/` | Crear activo |
| PATCH  | `/api/v1/activos/{id}` | Actualizar |
| PATCH  | `/api/v1/activos/{id}/km` | Actualizar KM |
| DELETE | `/api/v1/activos/{id}` | Dar de baja |

### Órdenes de trabajo
| Método | Ruta | Descripción |
|---|---|---|
| GET    | `/api/v1/ordenes/` | Listar OTs |
| GET    | `/api/v1/ordenes/{id}` | Detalle OT |
| POST   | `/api/v1/ordenes/` | Crear OT |
| PATCH  | `/api/v1/ordenes/{id}/iniciar` | Técnico inicia |
| PATCH  | `/api/v1/ordenes/{id}/cerrar` | Cerrar con solución |
| PATCH  | `/api/v1/ordenes/{id}/cancelar` | Cancelar |

### Dashboard
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/dashboard/` | Métricas + alertas |

---

## Roles y permisos

| Rol | Puede hacer |
|---|---|
| `admin` | Todo, incluyendo dar de baja activos y gestionar usuarios |
| `supervisor` | Crear/editar activos, crear/aprobar OTs, ver reportes |
| `tecnico` | Ver sus OTs asignadas, iniciar, cerrar, cargar checklist |
| `solo_lectura` | Solo consulta y reportes |

---

## Workflow de una OT

```
PENDIENTE → [técnico inicia] → EN_PROCESO → [técnico cierra] → COMPLETADA
    ↑                                                               ↓
    └──────────────────── [supervisor cancela] ───────────────── CANCELADA
```

---

## Deploy en producción (Ubuntu 24.04)

```bash
sudo bash deploy_setup.sh
```

Ver instrucciones completas en `deploy_setup.sh`.

---

## Branches

| Branch | Uso |
|---|---|
| `main` | Producción (servidor) |
| `develop` | Integración y pruebas |
| `feature/*` | Nuevas funcionalidades |

---

## Próximas fases

- **Fase 2:** Frontend React + dashboard visual
- **Fase 3:** Generación de reportes PDF por activo
- **Fase 4:** Notificaciones automáticas por alertas
- **Fase 5:** App móvil (PWA)
