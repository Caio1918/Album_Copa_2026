from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Selecao(Base):
    __tablename__ = "selecoes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    sigla: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    escudo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grupo_id: Mapped[int] = mapped_column(ForeignKey("grupos.id", ondelete="CASCADE"), nullable=False)

    grupo: Mapped["Grupo"] = relationship(back_populates="selecoes")
    jogadores: Mapped[list["Jogador"]] = relationship(back_populates="selecao", cascade="all, delete-orphan")
    figurinhas: Mapped[list["Figurinha"]] = relationship(back_populates="selecao", cascade="all, delete-orphan")
