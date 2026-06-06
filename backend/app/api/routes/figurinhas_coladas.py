from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.figurinha_colada import FigurinhaColada
from app.schemas.figurinha_colada_schema import FigurinhaColadaCreate, FigurinhaColadaResponse

router = APIRouter()


@router.get("", response_model=list[FigurinhaColadaResponse])
def listar_figurinhas_coladas(db: Session = Depends(get_db)):
    return db.query(FigurinhaColada).order_by(FigurinhaColada.data_colagem.desc()).all()


@router.get("/ultimas", response_model=list[FigurinhaColadaResponse])
def listar_ultimas_figurinhas_coladas(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(FigurinhaColada).order_by(FigurinhaColada.data_colagem.desc()).limit(limit).all()


@router.post("", response_model=FigurinhaColadaResponse, status_code=status.HTTP_201_CREATED)
def marcar_figurinha_como_colada(payload: FigurinhaColadaCreate, db: Session = Depends(get_db)):
    if not db.get(Figurinha, payload.figurinha_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha não encontrada")
    ja_colada = db.query(FigurinhaColada).filter(FigurinhaColada.figurinha_id == payload.figurinha_id).first()
    if ja_colada:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Figurinha já está colada")
    colada = FigurinhaColada(figurinha_id=payload.figurinha_id)
    db.add(colada)
    db.commit()
    db.refresh(colada)
    return colada


@router.delete("/{figurinha_id}", status_code=status.HTTP_204_NO_CONTENT)
def desmarcar_figurinha_colada(figurinha_id: int, db: Session = Depends(get_db)):
    colada = db.query(FigurinhaColada).filter(FigurinhaColada.figurinha_id == figurinha_id).first()
    if not colada:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha colada não encontrada")
    db.delete(colada)
    db.commit()
