from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Figurinha(Base):
    __tablename__ = "figurinhas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False, default="normal")
    imagem_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    jogador_id: Mapped[int | None] = mapped_column(ForeignKey("jogadores.id", ondelete="SET NULL"), nullable=True)
    selecao_id: Mapped[int] = mapped_column(ForeignKey("selecoes.id", ondelete="CASCADE"), nullable=False)

    jogador: Mapped["Jogador | None"] = relationship(back_populates="figurinhas")
    selecao: Mapped["Selecao"] = relationship(back_populates="figurinhas")
    colada: Mapped["FigurinhaColada | None"] = relationship(back_populates="figurinha", cascade="all, delete-orphan")
    repetida: Mapped["FigurinhaRepetida | None"] = relationship(back_populates="figurinha", cascade="all, delete-orphan")
