# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import engine, SessionLocal, Base

# create tables if not present (dev convenience)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Solar PV Emulator Backend",
    description="API backend for PV emulator web app",
    version="0.1.0"
)

# Dependency to provide a DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "Solar PV Emulator API is running!"}


# ---------------------------
# PV Modules endpoints
# ---------------------------

@app.post("/modules", response_model=schemas.PVModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(module_in: schemas.PVModuleCreate, db: Session = Depends(get_db)):
    # Prevent duplicate names (simple check)
    existing = db.query(models.PVModule).filter(models.PVModule.name == module_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Module with this name already exists")

    mod = models.PVModule(**module_in.dict())
    db.add(mod)
    db.commit()
    db.refresh(mod)
    return mod


@app.get("/modules", response_model=List[schemas.PVModuleResponse])
def read_modules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    modules = db.query(models.PVModule).offset(skip).limit(limit).all()
    return modules


@app.get("/modules/{module_id}", response_model=schemas.PVModuleResponse)
def read_module(module_id: int, db: Session = Depends(get_db)):
    mod = db.query(models.PVModule).filter(models.PVModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    return mod


@app.put("/modules/{module_id}", response_model=schemas.PVModuleResponse)
def update_module(module_id: int, module_in: schemas.PVModuleUpdate, db: Session = Depends(get_db)):
    mod = db.query(models.PVModule).filter(models.PVModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    update_data = module_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mod, key, value)
    db.add(mod)
    db.commit()
    db.refresh(mod)
    return mod


@app.delete("/modules/{module_id}", status_code=status.HTTP_200_OK)
def delete_module(module_id: int, db: Session = Depends(get_db)):
    mod = db.query(models.PVModule).filter(models.PVModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    db.delete(mod)
    db.commit()
    return {"detail": f"Module {module_id} deleted"}


# ---------------------------
# Simulation endpoint (placeholder physics, will replace with pvlib)
# ---------------------------

@app.post("/simulate_iv_curve/", response_model=schemas.SimulationResponse)
def generate_iv_curve(data: schemas.SimulationInput, db: Session = Depends(get_db)):
    # fetch module from DB
    mod = db.query(models.PVModule).filter(models.PVModule.id == data.module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    # Use STC by default or override with provided env conditions
    if data.use_environmental_conditions:
        G = data.irradiance if data.irradiance is not None else 1000.0
        T = data.temperature if data.temperature is not None else 25.0
        mode = "environment"
    else:
        G = 1000.0
        T = 25.0
        mode = "default"

    # Basic adjustments (placeholder):
    # - scale Isc roughly with irradiance
    # - adjust Voc linearly with temperature via kv (V/°C)
    # - adjust Imp and Vmp crudely (imp scales with G; vmp shifts with kv)
    kv = mod.kv if mod.kv is not None else 0.0
    ki = mod.ki if mod.ki is not None else 0.0

    Isc_adj = mod.isc * (G / 1000.0) + ki * (T - 25.0)
    Voc_adj = mod.voc + kv * (T - 25.0)
    # crudely adjust Vmp/Imp
    Vmp_adj = mod.vmp + kv * (T - 25.0)
    Imp_adj = mod.imp * (G / 1000.0) + ki * (T - 25.0)

    # numeric safety
    if Voc_adj <= 0:
        Voc_adj = max(0.1, mod.voc)
    if Vmp_adj <= 0:
        Vmp_adj = min(Voc_adj * 0.9, mod.vmp)

    # generate IV curve with piecewise linear approximation (good enough for plotting)
    n_points = 50
    iv_curve = []
    if Voc_adj <= 0.0:
        raise HTTPException(status_code=500, detail="Invalid Voc after adjustment")

    step = Voc_adj / (n_points - 1)
    for i in range(n_points):
        V = step * i
        if V <= Vmp_adj and Vmp_adj > 0:
            # linear interpolation from (0, Isc_adj) to (Vmp_adj, Imp_adj)
            I = Isc_adj + (Imp_adj - Isc_adj) * (V / Vmp_adj)
        else:
            # linear interpolation from (Vmp_adj, Imp_adj) to (Voc_adj, 0)
            if Voc_adj - Vmp_adj > 1e-6:
                I = Imp_adj * (1.0 - (V - Vmp_adj) / (Voc_adj - Vmp_adj))
            else:
                I = max(0.0, Imp_adj - (Imp_adj / (Voc_adj + 1e-6)) * V)
        if I < 0:
            I = 0.0
        iv_curve.append([round(V, 6), round(I, 6)])

    pv_curve = [[round(v, 6), round(v * i, 6)] for v, i in iv_curve]

    summary = {
        "Voc": round(Voc_adj, 6),
        "Isc": round(Isc_adj, 6),
        "Vmp": round(Vmp_adj, 6),
        "Imp": round(Imp_adj, 6),
        "Pmp": round(Vmp_adj * Imp_adj, 6),
    }

    resp = {
        "module_id": data.module_id,
        "mode": mode,
        "irradiance": G,
        "temperature": T,
        "iv_curve": iv_curve,
        "pv_curve": pv_curve,
        "summary": summary,
    }
    return resp
