from pydantic import BaseModel, ConfigDict


class FigurinhaBase(BaseModel):
    codigo: str
    tipo: str = "normal"
    selecao_id: int
    jogador_id: int | None = None
    imagem_url: str | None = None


class FigurinhaCreate(FigurinhaBase):
    pass


class FigurinhaUpdate(BaseModel):
    codigo: str | None = None
    tipo: str | None = None
    selecao_id: int | None = None
    jogador_id: int | None = None
    imagem_url: str | None = None


class FigurinhaResponse(FigurinhaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
