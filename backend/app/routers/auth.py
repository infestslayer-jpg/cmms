from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.usuario import Usuario
from app.core.security import verify_password, create_access_token, get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario_id: int
    nombre: str
    rol: str
    empresa_id: int


class ChangePasswordRequest(BaseModel):
    password_actual: str
    password_nuevo: str


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login con email y password. Retorna JWT."""
    user = db.query(Usuario).filter(
        Usuario.email == form.username,
        Usuario.activo == True
    ).first()

    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )

    # Actualizar último acceso
    user.ultimo_acceso = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id), "empresa_id": user.empresa_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario_id=user.id,
        nombre=user.nombre_completo,
        rol=user.rol.value,
        empresa_id=user.empresa_id
    )


@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna datos del usuario autenticado."""
    return {
        "id": current_user.id,
        "nombre": current_user.nombre_completo,
        "email": current_user.email,
        "rol": current_user.rol,
        "empresa_id": current_user.empresa_id,
        "ultimo_acceso": current_user.ultimo_acceso,
    }
