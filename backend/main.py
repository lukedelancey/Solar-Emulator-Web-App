# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlalchemy.orm import Session

import numpy as np

import models, schemas
from database import engine, SessionLocal, Base

import pvlib # will user for modeling the physics of the pv modules

# create tables if not present (dev convenience)
# Base.metadata.create_all(bind=engine) # removing this line because I'm using Alembic for migrations

app = FastAPI(
    title="Solar PV Emulator Backend",
    description="API backend for PV emulator web app",
    version="0.1.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",  # React dev server (alternative)
        "http://localhost:3001",  # Backup port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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
    # Validate celltype
    valid_celltypes = ['monoSi', 'multiSi', 'polySi', 'cis', 'cigs', 'cdte', 'amorphous']
    if module_in.celltype not in valid_celltypes:
        raise HTTPException(status_code=400, detail=f"Invalid celltype. Must be one of: {', '.join(valid_celltypes)}")

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

    # Validate celltype if it's being updated
    if 'celltype' in update_data:
        valid_celltypes = ['monoSi', 'multiSi', 'polySi', 'cis', 'cigs', 'cdte', 'amorphous']
        if update_data['celltype'] not in valid_celltypes:
            raise HTTPException(status_code=400, detail=f"Invalid celltype. Must be one of: {', '.join(valid_celltypes)}")

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
# Simulation endpoint (pvlib single-diode model)
# ---------------------------



@app.post("/simulate_iv_curve/", response_model=schemas.SimulationResponse)
def generate_iv_curve(data: schemas.SimulationInput, db: Session = Depends(get_db)):
    import numpy as np
    import pvlib
    from pvlib.ivtools import sdm

    # fetch module from DB
    mod = db.query(models.PVModule).filter(models.PVModule.id == data.module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    # Environmental conditions
    G = data.irradiance if data.use_environmental_conditions and data.irradiance is not None else 1000.0
    T = data.temperature if data.use_environmental_conditions and data.temperature is not None else 25.0

    try:
        # Handle edge case: zero irradiance
        if G <= 0:
            # Return a flat curve with zero current
            voltages = np.linspace(0, mod.voc, 200)
            currents = np.zeros_like(voltages)

            iv_curve = [[float(round(V, 6)), float(round(I, 6))] for V, I in zip(voltages, currents)]
            pv_curve = [[float(round(V, 6)), float(round(V * I, 6))] for V, I in zip(voltages, currents)]

            summary = {
                "Voc": 0.0,
                "Isc": 0.0,
                "Vmp": 0.0,
                "Imp": 0.0,
                "Pmp": 0.0
            }

            resp = {
                "module_id": data.module_id,
                "mode": "environment" if data.use_environmental_conditions else "default",
                "irradiance": G,
                "temperature": T,
                "iv_curve": iv_curve,
                "pv_curve": pv_curve,
                "summary": summary
            }
            return resp

        # Debug: Print module parameters
        print(f"DEBUG: Module params - Voc: {mod.voc}, Isc: {mod.isc}, Vmp: {mod.vmp}, Imp: {mod.imp}")
        print(f"DEBUG: Environmental conditions - G: {G}, T: {T}")

        # Step 1: Extract SDM parameters at reference conditions (STC)
        try:
            I_L_ref, I_o_ref, R_s, R_sh_ref, a_ref, Adjust = sdm.fit_cec_sam(
                celltype=mod.celltype,
                v_mp=mod.vmp,
                i_mp=mod.imp,
                v_oc=mod.voc,
                i_sc=mod.isc,
                alpha_sc=(mod.ki*mod.isc/100),  # Convert %/C to A/C
                beta_voc=(mod.kv*mod.voc/100),  # Convert %/C to V/C
                gamma_pmp=mod.gamma_pmp,
                cells_in_series=mod.ns,
                temp_ref=25
            )
            print(f"DEBUG: SDM fit results - I_L_ref: {I_L_ref}, I_o_ref: {I_o_ref}, R_s: {R_s}, R_sh_ref: {R_sh_ref}, a_ref: {a_ref}, Adjust: {Adjust}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SDM fit_cec_sam failed: {str(e)}")

        # Step 2: Scale to actual irradiance and temperature
        try:
            IL, I0, Rs, Rsh, nNsVth = pvlib.pvsystem.calcparams_desoto(
                effective_irradiance=G,
                temp_cell=T,
                alpha_sc=mod.ki,  # Use the original temperature coefficient from the module, not Adjust
                a_ref=a_ref,
                I_L_ref=I_L_ref,
                I_o_ref=I_o_ref,
                R_sh_ref=R_sh_ref,
                R_s=R_s,
                EgRef=1.121,
                dEgdT=-0.0002677
            )
            print(f"DEBUG: Scaled params - IL: {IL}, I0: {I0}, Rs: {Rs}, Rsh: {Rsh}, nNsVth: {nNsVth}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"calcparams_desoto failed: {str(e)}")

        # Step 3: Get the 5 key points
        try:
            sdm_out = pvlib.pvsystem.singlediode(
                photocurrent=IL,
                saturation_current=I0,
                resistance_series=Rs,
                resistance_shunt=Rsh,
                nNsVth=nNsVth,
                method='lambertw'
            )
            print(f"DEBUG: singlediode results - Voc: {sdm_out['v_oc']}, Isc: {sdm_out['i_sc']}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"singlediode failed: {str(e)}")

        # Debug: Check if singlediode output is valid
        voc_calc = sdm_out['v_oc']
        if not np.isfinite(voc_calc) or voc_calc <= 0:
            raise HTTPException(status_code=500, detail=f"Invalid Voc calculated: {voc_calc}. Check module parameters and environmental conditions.")

        # Step 4: Generate full IV curve using bishop88
        from pvlib.singlediode import bishop88

        # Create voltage array from 0 to Voc
        voltage_points = np.linspace(0, voc_calc, 200)
        print(f"DEBUG: Voltage range for bishop88: 0 to {voc_calc}")

        # bishop88 returns a tuple: (currents, voltages, power)
        try:
            currents, voltages, power = bishop88(
                diode_voltage=voltage_points,
                photocurrent=IL,
                saturation_current=I0,
                resistance_series=Rs,
                resistance_shunt=Rsh,
                nNsVth=nNsVth
            )
            print(f"DEBUG: bishop88 returned arrays of length: {len(currents)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"bishop88 failed: {str(e)}")

        # Ensure arrays are numpy arrays and handle any potential issues
        voltages = np.asarray(voltages)
        currents = np.asarray(currents)

        # Filter out any invalid values (NaN, inf, negative currents)
        valid_mask = (
            np.isfinite(voltages) &
            np.isfinite(currents) &
            (voltages >= 0) &
            (currents >= 0)
        )

        voltages = voltages[valid_mask]
        currents = currents[valid_mask]

        # Ensure we have some valid points
        if len(voltages) == 0:
            raise ValueError("No valid IV curve points generated")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SDM calculation failed: {str(e)}")

    # Extract IV and PV points
    iv_curve = [[float(round(V, 6)), float(round(I, 6))] for V, I in zip(voltages, currents)]
    pv_curve = [[float(round(V, 6)), float(round(V * I, 6))] for V, I in zip(voltages, currents)]

    # Max power point
    P = voltages * currents
    idx_max = np.argmax(P)
    Vmp = float(round(voltages[idx_max], 6))
    Imp = float(round(currents[idx_max], 6))
    Pmp = float(round(P[idx_max], 6))

    # Use the calculated values from the single diode model
    summary = {
        "Voc": float(round(sdm_out['v_oc'], 6)),
        "Isc": float(round(sdm_out['i_sc'], 6)),
        "Vmp": Vmp,
        "Imp": Imp,
        "Pmp": Pmp
    }

    resp = {
        "module_id": data.module_id,
        "mode": "environment" if data.use_environmental_conditions else "default",
        "irradiance": G,
        "temperature": T,
        "iv_curve": iv_curve,
        "pv_curve": pv_curve,
        "summary": summary
    }

    return resp
