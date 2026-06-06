from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class FigurinhaRepetida(Base):
    __tablename__ = "figurinhas_repetidas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    figurinha_id: Mapped[int] = mapped_column(ForeignKey("figurinhas.id", ondelete="CASCADE"), unique=True, nullable=False)
    quantidade: Mapped[int] = mapped_column(default=1, nullable=False)

    figurinha: Mapped["Figurinha"] = relationship(back_populates="repetida")
