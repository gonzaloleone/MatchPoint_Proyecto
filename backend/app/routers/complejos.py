from typing import List, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cancha, Complejo, Reserva, RolEnum, Usuario
from ..schemas import (
    CanchaResponse,
    ComplejoCreate,
    ComplejoResponse,
    ComplejoUpdate,
)
from .auth import get_current_user

router = APIRouter(
    prefix="/complejos",
    tags=["Complexes"],
)


# ── GET /complejos ────────────────────────────────────────────────────────────
@router.get("", response_model=List[ComplejoResponse])
def list_complejos(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    complejos = db.query(Complejo).options(joinedload(Complejo.canchas)).all()
    return complejos


# ── GET /complejos/mio ────────────────────────────────────────────────────────
@router.get("/mio", response_model=Optional[ComplejoResponse])
def get_my_complejo(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can access this endpoint",
        )
    complejo = (
        db.query(Complejo)
        .options(joinedload(Complejo.canchas))
        .filter(Complejo.id_duenio == current_user.id)
        .first()
    )
    return complejo  # None if owner has no complex yet


# ── GET /complejos/{complejo_id}/reservas  (owner view) ───────────────────────
@router.get("/{complejo_id}/reservas")
def get_complejo_reservas(
    complejo_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    # Verify existence and ownership
    complejo = db.query(Complejo).filter(Complejo.id == complejo_id).first()
    if not complejo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complex not found")
    if complejo.id_duenio != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your complex")

    # Collect cancha IDs that belong to this complex
    # Query IDs as raw scalars — avoids Column[int] type ambiguity
    cancha_id_rows = db.query(Cancha.id).filter(Cancha.id_complejo == complejo_id).all()
    cancha_ids = [row[0] for row in cancha_id_rows]
    if not cancha_ids:
        return []

    reservas = (
        db.query(Reserva)
        .options(joinedload(Reserva.cancha), joinedload(Reserva.cliente))
        .filter(Reserva.id_cancha.in_(cancha_ids))
        .order_by(Reserva.fecha.desc(), Reserva.hora_inicio.asc())
        .all()
    )

    result = []
    for r in reservas:
        cancha_obj: Optional[Cancha] = r.cancha
        cliente_obj: Optional[Usuario] = r.cliente
        result.append(
            {
                "id": r.id,
                "id_cliente": r.id_cliente,
                "cliente_nombre": cliente_obj.nombre if cliente_obj else "—",
                "id_cancha": r.id_cancha,
                "cancha_nombre": cancha_obj.nombre_numero if cancha_obj else "—",
                "cancha_deporte": cancha_obj.deporte if cancha_obj else "—",
                "fecha": str(r.fecha),
                "hora_inicio": str(r.hora_inicio),
                "hora_fin": str(r.hora_fin),
                "estado": r.estado,
                "total_pago": float(str(r.total_pago or 0)),
            }
        )
    return result


# ── GET /complejos/{complejo_id} ──────────────────────────────────────────────
@router.get("/{complejo_id}", response_model=ComplejoResponse)
def get_complejo(
    complejo_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    complejo = (
        db.query(Complejo)
        .options(joinedload(Complejo.canchas))
        .filter(Complejo.id == complejo_id)
        .first()
    )
    if not complejo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complex not found")
    return complejo


# ── POST /complejos ───────────────────────────────────────────────────────────
@router.post("", response_model=ComplejoResponse, status_code=status.HTTP_201_CREATED)
def create_complejo(
    complejo_data: ComplejoCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can create complexes",
        )

    new_complejo = Complejo(
        nombre=complejo_data.nombre,
        direccion=complejo_data.direccion,
        telefono=complejo_data.telefono,
        imagen_url=complejo_data.imagen_url,
        caracteristicas=complejo_data.caracteristicas,
        valoracion=complejo_data.valoracion,
        telefono_whatsapp=complejo_data.telefono_whatsapp,
        id_duenio=current_user.id,
    )
    db.add(new_complejo)
    db.commit()
    db.refresh(new_complejo)
    return new_complejo


# ── PUT /complejos/{complejo_id} ──────────────────────────────────────────────
@router.put("/{complejo_id}", response_model=ComplejoResponse)
def update_complejo(
    complejo_id: int,
    complejo_data: ComplejoUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can update complexes",
        )

    complejo = (
        db.query(Complejo)
        .filter(Complejo.id == complejo_id, Complejo.id_duenio == current_user.id)
        .first()
    )
    if not complejo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complex not found or you don't own it",
        )

    for field, value in complejo_data.model_dump(exclude_unset=True).items():
        setattr(complejo, field, value)

    db.commit()
    db.refresh(complejo)
    return complejo


# ── DELETE /complejos/{complejo_id} ──────────────────────────────────────────
@router.delete("/{complejo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complejo(
    complejo_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> None:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can delete complexes",
        )

    complejo = (
        db.query(Complejo)
        .filter(Complejo.id == complejo_id, Complejo.id_duenio == current_user.id)
        .first()
    )
    if not complejo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complex not found or you don't own it",
        )

    db.delete(complejo)
    db.commit()


# ── PATCH /complejos/{complejo_id}/valorar ───────────────────────────────────
from pydantic import BaseModel
from decimal import Decimal

class ValoracionBody(BaseModel):
    valoracion: Decimal

@router.patch("/{complejo_id}/valorar", response_model=ComplejoResponse)
def valorar_complejo(
    complejo_id: int,
    body: ValoracionBody,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    complejo = db.query(Complejo).filter(Complejo.id == complejo_id).first()
    if not complejo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complex not found")

    if complejo.valoracion is None:
        setattr(complejo, "valoracion", body.valoracion)
    else:
        new_val = (complejo.valoracion + body.valoracion) / Decimal("2.00")
        setattr(complejo, "valoracion", new_val)

    db.commit()
    db.refresh(complejo)
    return complejo
