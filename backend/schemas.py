# schemas.py
from pydantic import BaseModel
from typing import Optional, List

class PVModuleBase(BaseModel):
    name: str
    voc: float
    isc: float
    vmp: float
    imp: float
    ns: int
    kv: Optional[float] = None # Voc temp coeff (V/°C)
    ki: Optional[float] = None # Isc temp coeff (A/°C)

class PVModuleCreate(PVModuleBase):
    """Schema for creating new PV modules"""
    pass

class PVModuleUpdate(BaseModel):
    """Schema for updating existing PV modules; all fields optional"""
    name: Optional[str] = None
    voc: Optional[float] = None
    isc: Optional[float] = None
    vmp: Optional[float] = None
    imp: Optional[float] = None
    ns: Optional[int] = None
    kv: Optional[float] = None
    ki: Optional[float] = None

class PVModuleResponse(PVModuleBase):
    id: int

    class Config:
        orm_mode = True  # allow returning SQLAlchemy models directly

class SimulationInput(BaseModel):
    module_id: int
    use_environmental_conditions: bool = False
    irradiance: Optional[float] = None  # in W/m^2
    temperature: Optional[float] = None  # in °C

class SimulationSummary(BaseModel):
    Voc: float
    Isc: float
    Vmp: float
    Imp: float
    Pmp: float

class SimulationResponse(BaseModel):
    module_id: int
    mode: str
    irradiance: Optional[float] = None
    temperature: Optional[float] = None
    iv_curve: List[List[float]] = []
    pv_curve: List[List[float]] = []
    summary: Optional[SimulationSummary] = None
