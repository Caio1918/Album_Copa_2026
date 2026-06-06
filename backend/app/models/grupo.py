from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Grupo(Base):
    __tablename__ = "grupos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    selecoes: Mapped[list["Selecao"]] = relationship(back_populates="grupo", cascade="all, delete-orphan")
