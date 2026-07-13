from datetime import date as dt_date
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cancha, Complejo, Reserva, EstadoReservaEnum, RolEnum, DeporteEnum
from ..schemas import CanchaCreate, CanchaResponse
from .auth import get_current_user

router = APIRouter(
    prefix="/canchas",
    tags=["Fields"]
)


@router.post("", response_model=CanchaResponse, status_code=status.HTTP_201_CREATED)
def create_cancha(
    cancha_data: CanchaCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can create fields",
        )

    complejo = db.query(Complejo).filter(Complejo.id == cancha_data.id_complejo).first()
    if not complejo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complex not found")
    if complejo.id_duenio != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this complex")

    # Duplicate check: same nombre_numero + deporte + precio_hora within the same complejo
    duplicate = db.query(Cancha).filter(
        Cancha.id_complejo == cancha_data.id_complejo,
        Cancha.nombre_numero == cancha_data.nombre_numero,
        Cancha.deporte == cancha_data.deporte,
        Cancha.precio_hora == cancha_data.precio_hora,
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cancha con el mismo nombre, deporte y precio en este complejo. Modificá al menos un dato.",
        )

    new_cancha = Cancha(
        nombre_numero=cancha_data.nombre_numero,
        deporte=cancha_data.deporte,
        precio_hora=cancha_data.precio_hora,
        id_complejo=cancha_data.id_complejo,
    )
    db.add(new_cancha)
    db.commit()
    db.refresh(new_cancha)
    return new_cancha


@router.put("/{cancha_id}", response_model=CanchaResponse)
def update_cancha(
    cancha_id: int,
    cancha_data: CanchaCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can edit fields",
        )

    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")

    complejo = (
        db.query(Complejo)
        .filter(Complejo.id == cancha.id_complejo, Complejo.id_duenio == current_user.id)
        .first()
    )
    if not complejo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this complex")

    for field, value in cancha_data.model_dump(exclude_unset=True).items():
        if field != "id_complejo":  # id_complejo is not editable after creation
            setattr(cancha, field, value)
    db.commit()
    db.refresh(cancha)
    return cancha


@router.delete("/{cancha_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cancha(
    cancha_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> None:
    if current_user.rol != RolEnum.DUENIO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners (DUENIO) can delete fields",
        )

    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")

    complejo = (
        db.query(Complejo)
        .filter(Complejo.id == cancha.id_complejo, Complejo.id_duenio == current_user.id)
        .first()
    )
    if not complejo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this complex")

    db.delete(cancha)
    db.commit()


@router.get("", response_model=List[CanchaResponse])
def list_canchas(
    deporte: Optional[DeporteEnum] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    query = db.query(Cancha)
    if deporte is not None:
        query = query.filter(Cancha.deporte == deporte)
    return query.all()


@router.get("/{cancha_id}/reservas")
def get_cancha_availability(
    cancha_id: int,
    fecha: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Return booked time blocks for a specific cancha on a given date."""
    try:
        target_date = dt_date.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    reservas = (
        db.query(Reserva)
        .filter(
            Reserva.id_cancha == cancha_id,
            Reserva.fecha == target_date,
            Reserva.estado != EstadoReservaEnum.CANCELADA,
        )
        .all()
    )

    return [{"hora_inicio": str(r.hora_inicio), "hora_fin": str(r.hora_fin)} for r in reservas]
