import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from app.db.base import Base

class Work(Base):
    __tablename__ = "works"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    sprint_name: Mapped[str] = mapped_column(String(100), nullable=False)

    start_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD MVP
    end_date: Mapped[str] = mapped_column(String(10), nullable=False)

    hourly_rate_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="BRL", nullable=False)

    entries = relationship("TimeEntry", back_populates="work", cascade="all, delete-orphan")
