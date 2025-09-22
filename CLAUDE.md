# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Solar PV Emulator Web Application for ECEN 403 that simulates photovoltaic module behavior using physics-based modeling. The system generates IV (current-voltage) curves based on real-world solar panel parameters and environmental conditions.

## Development Setup

### Backend Development
```bash
# Navigate to backend directory
cd backend/

# Activate virtual environment (if exists)
source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Set up environment variables
# Create .env file with DATABASE_URL=postgresql://user:password@localhost/dbname

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Operations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Downgrade migration
alembic downgrade -1
```

### Testing
```bash
# Run all tests
pytest backend/test_simulate_iv_curve.py -v

# Run specific test
pytest backend/test_simulate_iv_curve.py::test_simulate_default -v

# Run with coverage
pytest backend/test_simulate_iv_curve.py --cov=backend --cov-report=html
```

## Architecture

### Backend Stack
- **FastAPI**: RESTful API framework with automatic OpenAPI documentation
- **SQLAlchemy**: ORM with declarative models
- **PostgreSQL**: Primary database with Alembic migrations
- **pvlib**: Solar physics library for single-diode modeling

### Database Models
- **User**: Basic user management with module ownership
- **PVModule**: Solar panel specifications including electrical parameters (Voc, Isc, Vmp, Imp), physical characteristics (ns), and temperature coefficients (kv, ki)

### API Endpoints
- `GET/POST/PUT/DELETE /modules/`: Full CRUD operations for PV modules
- `POST /simulate_iv_curve/`: Physics-based IV curve generation with environmental scaling

### Physics Engine
The simulation uses a sophisticated single-diode model workflow:

1. **Parameter Extraction**: Uses `pvlib.ivtools.sdm.fit_cec_sam()` to extract SDM parameters from nameplate ratings
2. **Environmental Scaling**: Applies `pvlib.pvsystem.calcparams_desoto()` for irradiance and temperature compensation
3. **Curve Generation**: Uses `pvlib.singlediode.bishop88()` to generate full IV curves from 0V to Voc
4. **Validation**: Includes extensive error handling for edge cases (zero irradiance, invalid parameters)

### Testing Framework
Comprehensive pytest suite with:
- **8 Module Types**: Various technologies (mono-Si, multi-Si, CdTe, CIGS, amorphous, bifacial)
- **6 Environmental Conditions**: STC, hot/cold, low irradiance, extreme temperatures
- **Performance Validation**: Monotonic IV curves, realistic temperature/irradiance effects
- **Edge Case Handling**: Zero irradiance, invalid modules, extreme conditions

### Frontend Status
The frontend directory exists but is empty - web interface implementation is pending.

## Key Development Notes

### Database Configuration
- Requires PostgreSQL with connection string in `.env` file
- Database URL format: `postgresql://user:password@localhost/dbname`
- Uses Alembic for schema migrations (not direct SQLAlchemy table creation)

### Physics Validation
- All modules must have realistic electrical parameters for SDM fitting
- Temperature coefficients (kv, ki) are critical for environmental modeling
- Series cell count (ns) affects voltage scaling and thermal behavior

### Error Handling
- Physics calculations include comprehensive validation for numerical stability
- API returns detailed error messages for debugging SDM parameter extraction
- Zero irradiance returns flat curves with appropriate summary values

### Performance
- IV curve simulations complete in <2 seconds
- 200-point voltage arrays provide smooth curve resolution
- Results cached as JSON arrays for efficient frontend consumption