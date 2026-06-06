from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.grupo import Grupo
from app.models.selecao import Selecao
from app.schemas.grupo_schema import GrupoCreate, GrupoResponse, GrupoUpdate
from app.schemas.selecao_schema import SelecaoResponse

router = APIRouter()


@router.get("", response_model=list[GrupoResponse])
def listar_grupos(db: Session = Depends(get_db)):
    return db.query(Grupo).order_by(Grupo.nome).all()


@router.get("/{grupo_id}", response_model=GrupoResponse)
def buscar_grupo(grupo_id: int, db: Session = Depends(get_db)):
    grupo = db.get(Grupo, grupo_id)
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    return grupo


@router.get("/{grupo_id}/selecoes", response_model=list[SelecaoResponse])
def listar_selecoes_do_grupo(grupo_id: int, db: Session = Depends(get_db)):
    if not db.get(Grupo, grupo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    return db.query(Selecao).filter(Selecao.grupo_id == grupo_id).order_by(Selecao.nome).all()


@router.post("", response_model=GrupoResponse, status_code=status.HTTP_201_CREATED)
def criar_grupo(payload: GrupoCreate, db: Session = Depends(get_db)):
    grupo = Grupo(**payload.model_dump())
    db.add(grupo)
    db.commit()
    db.refresh(grupo)
    return grupo


@router.put("/{grupo_id}", response_model=GrupoResponse)
def atualizar_grupo(grupo_id: int, payload: GrupoUpdate, db: Session = Depends(get_db)):
    grupo = db.get(Grupo, grupo_id)
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(grupo, campo, valor)
    db.commit()
    db.refresh(grupo)
    return grupo


@router.delete("/{grupo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_grupo(grupo_id: int, db: Session = Depends(get_db)):
    grupo = db.get(Grupo, grupo_id)
    if not grupo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado")
    db.delete(grupo)
    db.commit()
