from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class FigurinhaColada(Base):
    __tablename__ = "figurinhas_coladas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    figurinha_id: Mapped[int] = mapped_column(ForeignKey("figurinhas.id", ondelete="CASCADE"), unique=True, nullable=False)
    data_colagem: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    figurinha: Mapped["Figurinha"] = relationship(back_populates="colada")
