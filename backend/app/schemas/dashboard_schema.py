from pydantic import BaseModel


class DashboardResumo(BaseModel):
    total_figurinhas: int
    total_coladas: int
    total_faltantes: int
    porcentagem_completa: float
    normais_faltantes: int
    brilhantes_faltantes: int
    especiais_faltantes: int
    total_repetidas: int
