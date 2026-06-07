from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.figurinha_repetida import FigurinhaRepetida
from app.models.grupo import Grupo
from app.models.jogador import Jogador
from app.models.selecao import Selecao
from app.schemas.figurinha_repetida_schema import FigurinhaRepetidaCreate, FigurinhaRepetidaResponse, FigurinhaRepetidaUpdate

router = APIRouter()


def repetidas_query(db: Session):
    return db.query(FigurinhaRepetida).options(joinedload(FigurinhaRepetida.figurinha))


@router.get("", response_model=list[FigurinhaRepetidaResponse])
def listar_repetidas(db: Session = Depends(get_db)):
    return repetidas_query(db).order_by(FigurinhaRepetida.id).all()


@router.get("/search", response_model=list[FigurinhaRepetidaResponse])
def buscar_repetidas(termo: str = Query(min_length=1), db: Session = Depends(get_db)):
    termo_busca = f"%{termo}%"
    return (
        repetidas_query(db)
        .join(Figurinha, Figurinha.id == FigurinhaRepetida.figurinha_id)
        .join(Selecao, Selecao.id == Figurinha.selecao_id)
        .join(Grupo, Grupo.id == Selecao.grupo_id)
        .outerjoin(Jogador, Jogador.id == Figurinha.jogador_id)
        .filter(
            or_(
                Figurinha.codigo.ilike(termo_busca),
                Figurinha.tipo.ilike(termo_busca),
                Figurinha.nome.ilike(termo_busca),
                Figurinha.categoria.ilike(termo_busca),
                Jogador.nome.ilike(termo_busca),
                Selecao.nome.ilike(termo_busca),
                Selecao.sigla.ilike(termo_busca),
                Grupo.nome.ilike(termo_busca),
            )
        )
        .order_by(Figurinha.codigo)
        .all()
    )


@router.get("/{repetida_id}", response_model=FigurinhaRepetidaResponse)
def buscar_repetida(repetida_id: int, db: Session = Depends(get_db)):
    repetida = repetidas_query(db).filter(FigurinhaRepetida.id == repetida_id).first()
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
    return repetidas_query(db).filter(FigurinhaRepetida.id == repetida.id).first()


@router.put("/{repetida_id}", response_model=FigurinhaRepetidaResponse)
def atualizar_repetida(repetida_id: int, payload: FigurinhaRepetidaUpdate, db: Session = Depends(get_db)):
    repetida = db.get(FigurinhaRepetida, repetida_id)
    if not repetida:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha repetida não encontrada")
    repetida.quantidade = payload.quantidade
    db.commit()
    return repetidas_query(db).filter(FigurinhaRepetida.id == repetida.id).first()


@router.delete("/{repetida_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_repetida(repetida_id: int, db: Session = Depends(get_db)):
    repetida = db.get(FigurinhaRepetida, repetida_id)
    if not repetida:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha repetida não encontrada")
    db.delete(repetida)
    db.commit()
