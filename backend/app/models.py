import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time, Enum, Numeric, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from .database import Base

class RolEnum(str, enum.Enum):
    CLIENTE = "CLIENTE"
    DUENIO = "DUENIO"

class DeporteEnum(str, enum.Enum):
    PADEL = "PADEL"
    FUTBOL = "FUTBOL"
    TENIS = "TENIS"

class EstadoReservaEnum(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(Enum(RolEnum), nullable=False)

    # Relationships
    complejos = relationship("Complejo", back_populates="duenio", cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="cliente", cascade="all, delete-orphan")
    favoritos = relationship("Favorito", back_populates="cliente", cascade="all, delete-orphan")

class Complejo(Base):
    __tablename__ = "complejos"

    id = Column(Integer, primary_key=True, index=True)
    id_duenio = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    direccion = Column(String(200), nullable=False)
    telefono = Column(String(50), nullable=True)
    # New fields (v2)
    imagen_url = Column(Text, nullable=True)
    caracteristicas = Column(Text, nullable=True)
    valoracion = Column(Numeric(3, 2), nullable=False, default=5.00)
    telefono_whatsapp = Column(String(50), nullable=True)

    # Relationships
    duenio = relationship("Usuario", back_populates="complejos")
    canchas = relationship("Cancha", back_populates="complejo", cascade="all, delete-orphan")
    favoritos = relationship("Favorito", back_populates="complejo", cascade="all, delete-orphan")

class Cancha(Base):
    __tablename__ = "canchas"

    id = Column(Integer, primary_key=True, index=True)
    id_complejo = Column(Integer, ForeignKey("complejos.id"), nullable=False)
    nombre_numero = Column(String(50), nullable=False)
    deporte = Column(Enum(DeporteEnum), nullable=False)
    precio_hora = Column(Numeric(10, 2), nullable=False)

    # Relationships
    complejo = relationship("Complejo", back_populates="canchas")
    reservas = relationship("Reserva", back_populates="cancha", cascade="all, delete-orphan")

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_cancha = Column(Integer, ForeignKey("canchas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(Enum(EstadoReservaEnum), nullable=False)
    total_pago = Column(Numeric(10, 2), nullable=False)

    # Relationships
    cliente = relationship("Usuario", back_populates="reservas")
    cancha = relationship("Cancha", back_populates="reservas")

class Favorito(Base):
    __tablename__ = "favoritos"

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_complejo = Column(Integer, ForeignKey("complejos.id"), nullable=False)

    # Unique constraint: one user cannot favourite the same complex twice
    __table_args__ = (
        UniqueConstraint("id_cliente", "id_complejo", name="uq_favorito_cliente_complejo"),
    )

    # Relationships
    cliente = relationship("Usuario", back_populates="favoritos")
    complejo = relationship("Complejo", back_populates="favoritos")
