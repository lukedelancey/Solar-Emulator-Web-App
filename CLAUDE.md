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

### Frontend Stack
- **React 18**: Component-based UI framework with TypeScript
- **React Router**: Client-side routing for SPA navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Axios**: HTTP client for API communication
- **Recharts/Plotly**: Interactive data visualization for IV/PV curves
- **React Hook Form + Yup**: Form handling with validation
- **WebSockets**: Real-time communication for ESP32 device integration

## Frontend Architecture

### Development Setup
```bash
# Navigate to frontend directory
cd frontend/

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Page Structure
1. **PV Model Simulation** (`/simulation`)
   - Module selection dropdown with database integration
   - Environmental parameter inputs (temperature, irradiance)
   - Interactive IV/PV curve visualization with hover tooltips
   - Real-time plot generation and updates

2. **PV Modules Database** (`/modules`)
   - CRUD operations for user's PV module collection
   - Add module popup form with parameter validation
   - Bulk delete functionality with selection interface
   - Real-time list updates after operations

3. **PV Module Emulation** (`/emulation`)
   - ESP32 device pairing via Wi-Fi
   - Real-time emulation control (start/stop)
   - Live IV curve plotting with theoretical vs actual operating points
   - WebSocket-based data streaming from MCU

4. **About/Information** (`/about`)
   - Project documentation and user guides
   - ESP32 connection instructions
   - PDF hosting for reports and documentation

5. **Authentication** (`/auth`)
   - Sign up and sign in forms with validation
   - User session management
   - Protected route handling

### Component Architecture
```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Header.tsx    # Navigation and auth status
│   │   ├── Layout.tsx    # Page layout wrapper
│   │   └── StatusBar.tsx # Connection and auth indicators
│   ├── charts/           # Visualization components
│   │   ├── IVCurve.tsx   # IV curve plotting
│   │   └── PVCurve.tsx   # PV curve plotting
│   ├── forms/            # Form components
│   │   ├── ModuleForm.tsx    # Add/edit module forms
│   │   ├── AuthForms.tsx     # Login/signup forms
│   │   └── SimulationForm.tsx # Environmental parameter inputs
│   └── modals/           # Popup components
├── pages/                # Route components
├── hooks/                # Custom React hooks
├── services/             # API and WebSocket services
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
└── contexts/             # React contexts for state management
```

### API Integration Contract
**Base URL**: `http://localhost:8000`

**Authentication Endpoints**:
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User authentication
- `POST /auth/signout` - User logout

**Module Management**:
- `GET /modules/` - Fetch user's modules
- `POST /modules/` - Create new module
- `PUT /modules/{id}` - Update existing module
- `DELETE /modules/{id}` - Delete module

**Simulation**:
- `POST /simulate_iv_curve/` - Generate IV curves
  ```typescript
  interface SimulationRequest {
    module_id: number;
    temperature?: number;  // Default: 25°C
    irradiance?: number;   // Default: 1000 W/m²
  }

  interface SimulationResponse {
    voltage: number[];
    current: number[];
    power: number[];
    voc: number;
    isc: number;
    vmp: number;
    imp: number;
    pmp: number;
  }
  ```

**WebSocket Events** (ESP32 Integration):
- `device_connect` - ESP32 pairing request
- `device_disconnect` - ESP32 disconnection
- `emulation_start` - Begin data streaming
- `emulation_stop` - End data streaming
- `operating_point` - Real-time V/I data from MCU

### State Management
- **User Context**: Authentication state and user data
- **Module Context**: PV module collection and CRUD operations
- **Device Context**: ESP32 connection status and real-time data
- **Simulation Context**: Current simulation parameters and results

### Validation Schema (Yup)
```typescript
// Module validation
const moduleSchema = {
  name: string().required(),
  voc: number().positive().required(),
  isc: number().positive().required(),
  vmp: number().positive().required(),
  imp: number().positive().required(),
  ns: number().integer().positive().required(),
  kv: number().required(),
  ki: number().required()
}

// Environmental validation
const simulationSchema = {
  temperature: number().min(-40).max(85),  // °C
  irradiance: number().min(0).max(1500)    // W/m²
}
```

### Real-time Features
- **Live Plotting**: WebSocket updates for emulation operating points
- **Device Status**: Real-time ESP32 connection monitoring
- **Data Streaming**: Continuous V/I measurements during emulation
- **Auto-refresh**: Database updates after CRUD operations

### Frontend Development Notes
- **TypeScript**: Strict type checking enabled for robust development
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Error Boundaries**: Component-level error handling for graceful failures
- **Loading States**: Skeleton screens and spinners for async operations
- **Protected Routes**: Authentication-based route access control
- **Performance**: React.memo and useMemo for expensive re-renders
- **Accessibility**: ARIA labels and keyboard navigation support
- **Testing**: Unit tests with Jest and React Testing Library

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