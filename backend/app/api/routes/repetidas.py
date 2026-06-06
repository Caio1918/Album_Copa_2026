from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.figurinha_repetida import FigurinhaRepetida
from app.models.jogador import Jogador
from app.schemas.figurinha_repetida_schema import FigurinhaRepetidaCreate, FigurinhaRepetidaResponse, FigurinhaRepetidaUpdate

router = APIRouter()


@router.get("", response_model=list[FigurinhaRepetidaResponse])
def listar_repetidas(db: Session = Depends(get_db)):
    return db.query(FigurinhaRepetida).order_by(FigurinhaRepetida.id).all()


@router.get("/search", response_model=list[FigurinhaRepetidaResponse])
def buscar_repetidas_por_jogador(nome: str = Query(min_length=1), db: Session = Depends(get_db)):
    return (
        db.query(FigurinhaRepetida)
        .join(Figurinha, Figurinha.id == FigurinhaRepetida.figurinha_id)
        .join(Jogador, Jogador.id == Figurinha.jogador_id)
        .filter(Jogador.nome.ilike(f"%{nome}%"))
        .order_by(Jogador.nome)
        .all()
    )


@router.get("/{repetida_id}", response_model=FigurinhaRepetidaResponse)
def buscar_repetida(repetida_id: int, db: Session = Depends(get_db)):
    repetida = db.get(FigurinhaRepetida, repetida_id)
    if not repetida:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha repetida não encontrada")
    return repetida


@router.post("", response_model=FigurinhaRepetidaResponse, status_code=status.HTTP_201_CREATED)
def adicionar_repetida(payload: FigurinhaRepetidaCreate, db: Session = Depends(get_db)):
    if not db.get(Figurinha, payload.figurinha_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha não encontrada")
    repetida = db.query(FigurinhaRepetida).filter(FigurinhaRepetida.figurinha_id == payload.figurinha_id).first()
    if repetida:
        repetida.quantidade += payload.quantidade
    else:
        repetida = FigurinhaRepetida(**payload.model_dump())
        db.add(repetida)
    db.commit()
    db.refresh(repetida)
    return repetida


@router.put("/{repetida_id}", response_model=FigurinhaRepetidaResponse)
def atualizar_repetida(repetida_id: int, payload: FigurinhaRepetidaUpdate, db: Session = Depends(get_db)):
    repetida = db.get(FigurinhaRepetida, repetida_id)
    if not repetida:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha repetida não encontrada")
    repetida.quantidade = payload.quantidade
    db.commit()
    db.refresh(repetida)
    return repetida


@router.delete("/{repetida_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_repetida(repetida_id: int, db: Session = Depends(get_db)):
    repetida = db.get(FigurinhaRepetida, repetida_id)
    if not repetida:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha repetida não encontrada")
    db.delete(repetida)
    db.commit()
