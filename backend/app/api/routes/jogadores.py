from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.jogador import Jogador
from app.models.selecao import Selecao
from app.schemas.jogador_schema import JogadorCreate, JogadorResponse, JogadorUpdate

router = APIRouter()


@router.get("", response_model=list[JogadorResponse])
def listar_jogadores(db: Session = Depends(get_db)):
    return db.query(Jogador).order_by(Jogador.nome).all()


@router.get("/search", response_model=list[JogadorResponse])
def pesquisar_jogadores(nome: str = Query(min_length=1), db: Session = Depends(get_db)):
    return db.query(Jogador).filter(Jogador.nome.ilike(f"%{nome}%")).order_by(Jogador.nome).all()


@router.get("/{jogador_id}", response_model=JogadorResponse)
def buscar_jogador(jogador_id: int, db: Session = Depends(get_db)):
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogador não encontrado")
    return jogador


@router.post("", response_model=JogadorResponse, status_code=status.HTTP_201_CREATED)
def criar_jogador(payload: JogadorCreate, db: Session = Depends(get_db)):
    if not db.get(Selecao, payload.selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    jogador = Jogador(**payload.model_dump())
    db.add(jogador)
    db.commit()
    db.refresh(jogador)
    return jogador


@router.put("/{jogador_id}", response_model=JogadorResponse)
def atualizar_jogador(jogador_id: int, payload: JogadorUpdate, db: Session = Depends(get_db)):
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogador não encontrado")
    dados = payload.model_dump(exclude_unset=True)
    if "selecao_id" in dados and not db.get(Selecao, dados["selecao_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    for campo, valor in dados.items():
        setattr(jogador, campo, valor)
    db.commit()
    db.refresh(jogador)
    return jogador


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_jogador(jogador_id: int, db: Session = Depends(get_db)):
    jogador = db.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogador não encontrado")
    db.delete(jogador)
    db.commit()
