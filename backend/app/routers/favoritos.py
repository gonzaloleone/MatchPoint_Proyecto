from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import Favorito, Complejo
from ..schemas import FavoritoResponse
from .auth import get_current_user

router = APIRouter(
    prefix="/favoritos",
    tags=["Favourites"]
)

@router.post("/{id_complejo}", response_model=FavoritoResponse, status_code=status.HTTP_201_CREATED)
def add_favorito(
    id_complejo: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    # Verify complex exists
    complejo = db.query(Complejo).filter(Complejo.id == id_complejo).first()
    if not complejo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complex not found"
        )

    # Check for existing favourite (pre-check for cleaner error message)
    existing = db.query(Favorito).filter(
        Favorito.id_cliente == current_user.id,
        Favorito.id_complejo == id_complejo
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complex is already in your favourites"
        )

    new_fav = Favorito(id_cliente=current_user.id, id_complejo=id_complejo)
    db.add(new_fav)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complex is already in your favourites"
        )
    db.refresh(new_fav)
    return new_fav

@router.delete("/{id_complejo}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorito(
    id_complejo: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> None:
    fav = db.query(Favorito).filter(
        Favorito.id_cliente == current_user.id,
        Favorito.id_complejo == id_complejo
    ).first()

    if not fav:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favourite not found"
        )

    db.delete(fav)
    db.commit()

@router.get("", response_model=List[FavoritoResponse])
def list_favoritos(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
) -> Any:
    favs = db.query(Favorito).filter(Favorito.id_cliente == current_user.id).all()
    return favs
