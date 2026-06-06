from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FigurinhaColadaCreate(BaseModel):
    figurinha_id: int


class FigurinhaColadaResponse(BaseModel):
    id: int
    figurinha_id: int
    data_colagem: datetime

    model_config = ConfigDict(from_attributes=True)
