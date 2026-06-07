from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.grupo import Grupo
from app.models.jogador import Jogador
from app.models.selecao import Selecao
from app.schemas.figurinha_schema import FigurinhaResponse
from app.schemas.jogador_schema import JogadorResponse
from app.schemas.selecao_schema import SelecaoCreate, SelecaoResponse, SelecaoUpdate

router = APIRouter()


@router.get("", response_model=list[SelecaoResponse])
def listar_selecoes(db: Session = Depends(get_db)):
    return db.query(Selecao).order_by(Selecao.nome).all()


@router.get("/{selecao_id}", response_model=SelecaoResponse)
def buscar_selecao(selecao_id: int, db: Session = Depends(get_db)):
    selecao = db.get(Selecao, selecao_id)
    if not selecao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    return selecao


@router.get("/{selecao_id}/jogadores", response_model=list[JogadorResponse])
def listar_jogadores_da_selecao(selecao_id: int, db: Session = Depends(get_db)):
    if not db.get(Selecao, selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    return db.query(Jogador).filter(Jogador.selecao_id == selecao_id).order_by(Jogador.nome).all()


@router.get("/{selecao_id}/figurinhas", response_model=list[FigurinhaResponse])
def listar_figurinhas_da_selecao(selecao_id: int, db: Session = Depends(get_db)):
    if not db.get(Selecao, selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    return (
        db.query(Figurinha)
        .filter(Figurinha.selecao_id == selecao_id)
        .order_by(Figurinha.numero_global.asc().nulls_last(), Figurinha.codigo.asc())
        .all()
    )


@router.post("", response_model=SelecaoResponse, status_code=status.HTTP_201_CREATED)
def criar_selecao(payload: SelecaoCreate, db: Session = Depends(get_db)):
    if not db.get(Grupo, payload.grupo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    selecao = Selecao(**payload.model_dump())
    db.add(selecao)
    db.commit()
    db.refresh(selecao)
    return selecao


@router.put("/{selecao_id}", response_model=SelecaoResponse)
def atualizar_selecao(selecao_id: int, payload: SelecaoUpdate, db: Session = Depends(get_db)):
    selecao = db.get(Selecao, selecao_id)
    if not selecao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    dados = payload.model_dump(exclude_unset=True)
    if "grupo_id" in dados and not db.get(Grupo, dados["grupo_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    for campo, valor in dados.items():
        setattr(selecao, campo, valor)
    db.commit()
    db.refresh(selecao)
    return selecao


@router.delete("/{selecao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_selecao(selecao_id: int, db: Session = Depends(get_db)):
    selecao = db.get(Selecao, selecao_id)
    if not selecao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    db.delete(selecao)
    db.commit()
