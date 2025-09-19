# backend/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=True)
    hashed_password = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    modules = relationship("PVModule", back_populates="owner")

class PVModule(Base):
    __tablename__ = "pvmodules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for global modules
    name = Column(String(256), nullable=False, index=True)
    voc = Column(Float, nullable=False)
    isc = Column(Float, nullable=False)
    vmp = Column(Float, nullable=False)
    imp = Column(Float, nullable=False)
    ns = Column(Integer, nullable=False)
    kv = Column(Float, nullable=True)
    ki = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="modules")
