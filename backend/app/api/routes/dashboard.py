from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.database import get_db
from app.models.figurinha import Figurinha
from app.models.figurinha_colada import FigurinhaColada
from app.models.figurinha_repetida import FigurinhaRepetida
from app.schemas.dashboard_schema import DashboardResumo
from app.schemas.figurinha_colada_schema import FigurinhaColadaResponse

router = APIRouter()


@router.get("/resumo", response_model=DashboardResumo)
def obter_resumo(db: Session = Depends(get_db)):
    total_figurinhas = db.query(Figurinha).count()
    total_coladas = db.query(FigurinhaColada).count()
    total_faltantes = max(total_figurinhas - total_coladas, 0)
    porcentagem = round((total_coladas / total_figurinhas) * 100, 2) if total_figurinhas else 0

    faltantes = db.query(Figurinha).outerjoin(FigurinhaColada).filter(FigurinhaColada.id.is_(None))
    normais_faltantes = faltantes.filter(Figurinha.tipo == "normal").count()
    brilhantes_faltantes = db.query(Figurinha).outerjoin(FigurinhaColada).filter(FigurinhaColada.id.is_(None), Figurinha.tipo == "brilhante").count()
    total_repetidas = sum(item.quantidade for item in db.query(FigurinhaRepetida).all())

    return DashboardResumo(
        total_figurinhas=total_figurinhas,
        total_coladas=total_coladas,
        total_faltantes=total_faltantes,
        porcentagem_completa=porcentagem,
        normais_faltantes=normais_faltantes,
        brilhantes_faltantes=brilhantes_faltantes,
        total_repetidas=total_repetidas,
    )


@router.get("/progresso")
def obter_progresso(db: Session = Depends(get_db)):
    total_figurinhas = db.query(Figurinha).count()
    total_coladas = db.query(FigurinhaColada).count()
    porcentagem = round((total_coladas / total_figurinhas) * 100, 2) if total_figurinhas else 0
    return {"total_figurinhas": total_figurinhas, "total_coladas": total_coladas, "porcentagem_completa": porcentagem}


@router.get("/faltantes")
def obter_quantidade_faltantes(db: Session = Depends(get_db)):
    total_figurinhas = db.query(Figurinha).count()
    total_coladas = db.query(FigurinhaColada).count()
    return {"total_faltantes": max(total_figurinhas - total_coladas, 0)}


@router.get("/ultimas-coladas", response_model=list[FigurinhaColadaResponse])
def obter_ultimas_coladas(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(FigurinhaColada).order_by(FigurinhaColada.data_colagem.desc()).limit(limit).all()
