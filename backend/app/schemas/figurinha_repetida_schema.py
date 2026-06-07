from pydantic import BaseModel, ConfigDict, Field

from app.schemas.figurinha_schema import FigurinhaResponse


class FigurinhaRepetidaCreate(BaseModel):
    figurinha_id: int
    quantidade: int = Field(default=1, ge=1)


class FigurinhaRepetidaUpdate(BaseModel):
    quantidade: int = Field(ge=1)


class FigurinhaRepetidaResponse(BaseModel):
    id: int
    figurinha_id: int
    quantidade: int
    figurinha: FigurinhaResponse | None = None

    model_config = ConfigDict(from_attributes=True)
