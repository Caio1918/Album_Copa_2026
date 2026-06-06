from pydantic import BaseModel, ConfigDict


class SelecaoBase(BaseModel):
    nome: str
    sigla: str
    grupo_id: int
    escudo_url: str | None = None


class SelecaoCreate(SelecaoBase):
    pass


class SelecaoUpdate(BaseModel):
    nome: str | None = None
    sigla: str | None = None
    grupo_id: int | None = None
    escudo_url: str | None = None


class SelecaoResponse(SelecaoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
