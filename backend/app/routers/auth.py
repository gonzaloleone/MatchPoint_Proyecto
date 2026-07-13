import bcrypt  # type: ignore
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError  # type: ignore
from typing import Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import UserCreate, UserLogin, UserResponse, Token, TokenData

# JWT Configuration constants
SECRET_KEY = "366d8ba96ccbe040854497e20b0800e84ec1cf8fa838e5ee60064b8bb2138e07"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Password utility functions using native bcrypt
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return str(hashed.decode('utf-8'))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bool(bcrypt.checkpw(password_bytes, hashed_bytes))

# JWT utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return str(encoded_jwt)

# Dependency to get currently authenticated user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Explicit type annotation to satisfy type checkers
        payload: Dict[str, Any] = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw = payload.get("sub")
        rol_raw = payload.get("rol")
        
        if user_id_raw is None or rol_raw is None:
            raise credentials_exception
            
        user_id: int = int(user_id_raw)
        rol: str = str(rol_raw)
        token_data = TokenData(user_id=user_id, rol=rol)
    except (JWTError, ValueError, TypeError, AttributeError):
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication Endpoints
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> Any:
    # Validate password length
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres"
        )

    # Check if email is already registered
    db_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Hash password and create User
    hashed_pwd = hash_password(user_data.password)
    new_user = Usuario(
        nombre=user_data.nombre,
        email=user_data.email,
        password=hashed_pwd,
        rol=user_data.rol
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)) -> Any:
    # Check user credentials
    user = db.query(Usuario).filter(Usuario.email == credentials.email).first()
    if not user or not verify_password(credentials.password, str(user.password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token containing sub (user_id) and rol
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Safely access and stringify role to bypass SQLAlchemy Column type check warnings
    role_str = str(user.rol.value) if hasattr(user.rol, "value") else str(user.rol)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "rol": role_str, "nombre": str(user.nombre)},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ── PATCH /auth/me/password ───────────────────────────────────────────────────
from pydantic import BaseModel

class PasswordUpdate(BaseModel):
    password: str

@router.patch("/me/password", status_code=204)
def change_password(
    body: PasswordUpdate,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres"
        )
    current_user.password = hash_password(body.password)
    db.commit()
