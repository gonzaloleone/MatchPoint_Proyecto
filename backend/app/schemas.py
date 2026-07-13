from pydantic import BaseModel, EmailStr
from typing import Optional, List
from decimal import Decimal
from datetime import date, time
from .models import RolEnum, DeporteEnum, EstadoReservaEnum

# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    nombre: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    rol: RolEnum

class UserResponse(UserBase):
    id: int
    rol: RolEnum

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ---------------------------------------------------------------------------
# Token schemas
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    rol: Optional[str] = None

# ---------------------------------------------------------------------------
# Cancha schemas (defined BEFORE Complejo so it can be referenced)
# ---------------------------------------------------------------------------
class CanchaBase(BaseModel):
    nombre_numero: str
    deporte: DeporteEnum
    precio_hora: Decimal

class CanchaCreate(CanchaBase):
    id_complejo: int

class CanchaResponse(CanchaBase):
    id: int
    id_complejo: int

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Complejo schemas
# ---------------------------------------------------------------------------
class ComplejoBase(BaseModel):
    nombre: str
    direccion: str
    telefono: Optional[str] = None
    imagen_url: Optional[str] = None
    caracteristicas: Optional[str] = None
    valoracion: Optional[Decimal] = Decimal("5.00")
    telefono_whatsapp: Optional[str] = None

class ComplejoCreate(ComplejoBase):
    pass

class ComplejoUpdate(ComplejoBase):
    pass

class ComplejoResponse(ComplejoBase):
    id: int
    id_duenio: int
    canchas: List[CanchaResponse] = []

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Reserva schemas
# ---------------------------------------------------------------------------
class ReservaBase(BaseModel):
    id_cancha: int
    fecha: date
    hora_inicio: time
    hora_fin: time

class ReservaCreate(ReservaBase):
    pass

class ReservaResponse(ReservaBase):
    id: int
    id_cliente: int
    estado: EstadoReservaEnum
    total_pago: Decimal

    class Config:
        from_attributes = True

class ReservaDetailResponse(ReservaBase):
    """Enriched reserva response with nested cancha and complejo data."""
    id: int
    id_cliente: int
    estado: EstadoReservaEnum
    total_pago: Decimal
    cancha: Optional[CanchaResponse] = None
    complejo: Optional[ComplejoResponse] = None

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Favorito schemas
# ---------------------------------------------------------------------------
class FavoritoResponse(BaseModel):
    id: int
    id_cliente: int
    id_complejo: int
    complejo: ComplejoResponse

    class Config:
        from_attributes = True
