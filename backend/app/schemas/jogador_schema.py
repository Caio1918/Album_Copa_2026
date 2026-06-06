from pydantic import BaseModel, ConfigDict


class JogadorBase(BaseModel):
    nome: str
    selecao_id: int
    posicao: str | None = None
    numero: int | None = None


class JogadorCreate(JogadorBase):
    pass


class JogadorUpdate(BaseModel):
    nome: str | None = None
    selecao_id: int | None = None
    posicao: str | None = None
    numero: int | None = None


class JogadorResponse(JogadorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
