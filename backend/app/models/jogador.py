from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Jogador(Base):
    __tablename__ = "jogadores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    posicao: Mapped[str | None] = mapped_column(String(50), nullable=True)
    numero: Mapped[int | None] = mapped_column(nullable=True)
    selecao_id: Mapped[int] = mapped_column(ForeignKey("selecoes.id", ondelete="CASCADE"), nullable=False)

    selecao: Mapped["Selecao"] = relationship(back_populates="jogadores")
    figurinhas: Mapped[list["Figurinha"]] = relationship(back_populates="jogador")
