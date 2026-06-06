from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Figurinha(Base):
    __tablename__ = "figurinhas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    codigo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False, default="normal", index=True)
    imagem_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero_global: Mapped[int | None] = mapped_column(nullable=True, unique=True, index=True)
    numero_na_selecao: Mapped[int | None] = mapped_column(nullable=True)
    nome: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    secao: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    fonte_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status_cadastro: Mapped[str | None] = mapped_column(String(50), nullable=True)
    jogador_id: Mapped[int | None] = mapped_column(ForeignKey("jogadores.id", ondelete="SET NULL"), nullable=True)
    selecao_id: Mapped[int] = mapped_column(ForeignKey("selecoes.id", ondelete="CASCADE"), nullable=False)

    jogador: Mapped["Jogador | None"] = relationship(back_populates="figurinhas")
    selecao: Mapped["Selecao"] = relationship(back_populates="figurinhas")
    colada: Mapped["FigurinhaColada | None"] = relationship(back_populates="figurinha", cascade="all, delete-orphan")
    repetida: Mapped["FigurinhaRepetida | None"] = relationship(back_populates="figurinha", cascade="all, delete-orphan")
