from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth_router, complejos_router, canchas_router, reservas_router, favoritos_router
from .routers.auth import get_current_user
from .models import Usuario

app = FastAPI(
    title="MatchPoint API",
    description="Backend API for MatchPoint sports field booking application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(complejos_router)
app.include_router(canchas_router)
app.include_router(reservas_router)
app.include_router(favoritos_router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to MatchPoint API",
        "status": "healthy"
    }

@app.get("/users/me")
def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "rol": current_user.rol.value
    }

