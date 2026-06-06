from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.figurinha_colada import FigurinhaColada
from app.models.selecao import Selecao
from app.schemas.figurinha_schema import FigurinhaResponse

router = APIRouter()


def query_faltantes(db: Session):
    return db.query(Figurinha).outerjoin(FigurinhaColada).filter(FigurinhaColada.id.is_(None))


@router.get("", response_model=list[FigurinhaResponse])
def listar_faltantes(db: Session = Depends(get_db)):
    return query_faltantes(db).order_by(Figurinha.codigo).all()


@router.get("/normais", response_model=list[FigurinhaResponse])
def listar_faltantes_normais(db: Session = Depends(get_db)):
    return query_faltantes(db).filter(Figurinha.tipo == "normal").order_by(Figurinha.codigo).all()


@router.get("/brilhantes", response_model=list[FigurinhaResponse])
def listar_faltantes_brilhantes(db: Session = Depends(get_db)):
    return query_faltantes(db).filter(Figurinha.tipo == "brilhante").order_by(Figurinha.codigo).all()


@router.get("/selecao/{selecao_id}", response_model=list[FigurinhaResponse])
def listar_faltantes_por_selecao(selecao_id: int, db: Session = Depends(get_db)):
    if not db.get(Selecao, selecao_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    return query_faltantes(db).filter(Figurinha.selecao_id == selecao_id).order_by(Figurinha.codigo).all()
