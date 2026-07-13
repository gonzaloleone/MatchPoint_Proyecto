from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cancha, Complejo, Reserva, EstadoReservaEnum
from ..schemas import (
    CanchaResponse,
    ComplejoResponse,
    ReservaCreate,
    ReservaDetailResponse,
    ReservaResponse,
)
from .auth import get_current_user

router = APIRouter(
    prefix="/reservas",
    tags=["Reservations"],
)


# ── DELETE /reservas/historial ────────────────────────────────────────────────
@router.delete("/historial", status_code=status.HTTP_204_NO_CONTENT)
def clear_historial(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> None:
    """Permanently delete all CANCELADA reservations for the current user."""
    db.query(Reserva).filter(
        Reserva.id_cliente == current_user.id,
        Reserva.estado == EstadoReservaEnum.CANCELADA,
    ).delete(synchronize_session=False)
    db.commit()


# ── PATCH /reservas/{reserva_id}/estado ──────────────────────────────────────
@router.patch("/{reserva_id}/estado", response_model=ReservaResponse)
def update_reserva_estado(
    reserva_id: int,
    nuevo_estado: EstadoReservaEnum = Query(..., description="New reservation status"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    # Owner can update any state on their complex; client can only cancel their own
    cancha: Optional[Cancha] = db.query(Cancha).filter(Cancha.id == reserva.id_cancha).first()
    complejo: Optional[Complejo] = (
        db.query(Complejo)
        .filter(Complejo.id == (cancha.id_complejo if cancha else -1))
        .first()
    )

    is_owner = complejo is not None and complejo.id_duenio == current_user.id
    is_client = reserva.id_cliente == current_user.id

    if not is_owner and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if not is_owner and nuevo_estado != EstadoReservaEnum.CANCELADA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clients can only cancel their reservations",
        )

    setattr(reserva, 'estado', nuevo_estado)
    db.commit()
    db.refresh(reserva)
    return reserva


# ── GET /reservas/ ────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ReservaDetailResponse])
def list_reservas(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Return all reservations for the authenticated user, with nested cancha+complejo."""
    reservas = (
        db.query(Reserva)
        .options(joinedload(Reserva.cancha).joinedload(Cancha.complejo))
        .filter(Reserva.id_cliente == current_user.id)
        .order_by(Reserva.fecha.desc(), Reserva.hora_inicio.desc())
        .all()
    )

    result: List[ReservaDetailResponse] = []
    for r in reservas:
        cancha_obj: Optional[Cancha] = r.cancha
        complejo_obj = cancha_obj.complejo if cancha_obj else None

        cancha_resp: Optional[CanchaResponse] = (
            CanchaResponse.model_validate(cancha_obj) if cancha_obj else None
        )
        complejo_resp: Optional[ComplejoResponse] = (
            ComplejoResponse.model_validate(complejo_obj) if complejo_obj else None
        )

        result.append(
            ReservaDetailResponse.model_validate(
                {
                    "id": r.id,
                    "id_cliente": r.id_cliente,
                    "id_cancha": r.id_cancha,
                    "fecha": r.fecha,
                    "hora_inicio": r.hora_inicio,
                    "hora_fin": r.hora_fin,
                    "estado": r.estado,
                    "total_pago": r.total_pago,
                    "cancha": cancha_resp,
                    "complejo": complejo_resp,
                }
            )
        )
    return result


# ── POST /reservas/ ───────────────────────────────────────────────────────────
@router.post("/", response_model=ReservaResponse, status_code=status.HTTP_201_CREATED)
def create_reserva(
    reserva_data: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    # Validate time order
    if reserva_data.hora_inicio >= reserva_data.hora_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time",
        )

    cancha = db.query(Cancha).filter(Cancha.id == reserva_data.id_cancha).first()
    if not cancha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Court not found")

    # Concurrency Control (RF-04): strict overlap check
    overlap = (
        db.query(Reserva)
        .filter(
            Reserva.id_cancha == reserva_data.id_cancha,
            Reserva.fecha == reserva_data.fecha,
            Reserva.estado != EstadoReservaEnum.CANCELADA,
            Reserva.hora_inicio < reserva_data.hora_fin,
            Reserva.hora_fin > reserva_data.hora_inicio,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The court is already booked for the selected time slot",
        )

    # Calculate duration and price
    dt_dummy = datetime.today().date()
    start_dt = datetime.combine(dt_dummy, reserva_data.hora_inicio)
    end_dt = datetime.combine(dt_dummy, reserva_data.hora_fin)
    duration_hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600.0))
    total_pago = cancha.precio_hora * duration_hours

    new_reserva = Reserva(
        id_cliente=current_user.id,
        id_cancha=reserva_data.id_cancha,
        fecha=reserva_data.fecha,
        hora_inicio=reserva_data.hora_inicio,
        hora_fin=reserva_data.hora_fin,
        estado=EstadoReservaEnum.PENDIENTE,
        total_pago=total_pago,
    )

    db.add(new_reserva)
    db.commit()
    db.refresh(new_reserva)
    return new_reserva
