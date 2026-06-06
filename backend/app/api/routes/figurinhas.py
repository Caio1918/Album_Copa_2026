from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.jogador import Jogador
from app.models.selecao import Selecao
from app.schemas.figurinha_schema import FigurinhaCreate, FigurinhaResponse, FigurinhaUpdate

router = APIRouter()


@router.get("", response_model=list[FigurinhaResponse])
def listar_figurinhas(db: Session = Depends(get_db)):
    return db.query(Figurinha).order_by(Figurinha.codigo).all()


@router.get("/search", response_model=list[FigurinhaResponse])
def pesquisar_figurinhas(termo: str = Query(min_length=1), db: Session = Depends(get_db)):
    return db.query(Figurinha).filter(or_(Figurinha.codigo.ilike(f"%{termo}%"), Figurinha.tipo.ilike(f"%{termo}%"))).order_by(Figurinha.codigo).all()


@router.get("/selecao/{selecao_id}", response_model=list[FigurinhaResponse])
def listar_figurinhas_por_selecao(selecao_id: int, db: Session = Depends(get_db)):
    if not db.get(Selecao, selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    return db.query(Figurinha).filter(Figurinha.selecao_id == selecao_id).order_by(Figurinha.codigo).all()


@router.get("/{figurinha_id}", response_model=FigurinhaResponse)
def buscar_figurinha(figurinha_id: int, db: Session = Depends(get_db)):
    figurinha = db.get(Figurinha, figurinha_id)
    if not figurinha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha não encontrada")
    return figurinha


@router.post("", response_model=FigurinhaResponse, status_code=status.HTTP_201_CREATED)
def criar_figurinha(payload: FigurinhaCreate, db: Session = Depends(get_db)):
    if not db.get(Selecao, payload.selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    if payload.jogador_id and not db.get(Jogador, payload.jogador_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogador não encontrado")
    figurinha = Figurinha(**payload.model_dump())
    db.add(figurinha)
    db.commit()
    db.refresh(figurinha)
    return figurinha


@router.put("/{figurinha_id}", response_model=FigurinhaResponse)
def atualizar_figurinha(figurinha_id: int, payload: FigurinhaUpdate, db: Session = Depends(get_db)):
    figurinha = db.get(Figurinha, figurinha_id)
    if not figurinha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha não encontrada")
    dados = payload.model_dump(exclude_unset=True)
    if "selecao_id" in dados and not db.get(Selecao, dados["selecao_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    if dados.get("jogador_id") and not db.get(Jogador, dados["jogador_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogador não encontrado")
    for campo, valor in dados.items():
        setattr(figurinha, campo, valor)
    db.commit()
    db.refresh(figurinha)
    return figurinha


@router.delete("/{figurinha_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_figurinha(figurinha_id: int, db: Session = Depends(get_db)):
    figurinha = db.get(Figurinha, figurinha_id)
    if not figurinha:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Figurinha não encontrada")
    db.delete(figurinha)
    db.commit()
