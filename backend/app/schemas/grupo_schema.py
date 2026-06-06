from pydantic import BaseModel, ConfigDict


class GrupoBase(BaseModel):
    nome: str


class GrupoCreate(GrupoBase):
    pass


class GrupoUpdate(BaseModel):
    nome: str | None = None


class GrupoResponse(GrupoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
