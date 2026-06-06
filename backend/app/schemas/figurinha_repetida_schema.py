from pydantic import BaseModel, ConfigDict, Field


class FigurinhaRepetidaCreate(BaseModel):
    figurinha_id: int
    quantidade: int = Field(default=1, ge=1)


class FigurinhaRepetidaUpdate(BaseModel):
    quantidade: int = Field(ge=0)


class FigurinhaRepetidaResponse(BaseModel):
    id: int
    figurinha_id: int
    quantidade: int

    model_config = ConfigDict(from_attributes=True)
