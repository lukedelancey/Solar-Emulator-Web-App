// TypeScript interfaces for PV modules, simulation data, and API responses

// Valid cell technology types
export const VALID_CELLTYPES = [
  'monoSi',
  'multiSi',
  'polySi',
  'cis',
  'cigs',
  'cdte',
  'amorphous'
] as const;

export type CellType = typeof VALID_CELLTYPES[number];

// Base PV Module interface (from database)
export interface PVModule {
  id: number;
  name: string;
  voc: number;  // Open circuit voltage (V)
  isc: number;  // Short circuit current (A)
  vmp: number;  // Voltage at maximum power (V)
  imp: number;  // Current at maximum power (A)
  ns: number;   // Number of cells in series
  kv: number;   // Temperature coefficient of voltage [%/°C]
  ki: number;   // Temperature coefficient of current [%/°C]
  celltype: string;  // Cell technology type
  gamma_pmp: number;  // Temperature coefficient of power [%/°C]
}

// For creating new modules (no id field)
export interface PVModuleCreate {
  name: string;
  voc: number;
  isc: number;
  vmp: number;
  imp: number;
  ns: number;
  kv: number;
  ki: number;
  celltype: string;
  gamma_pmp: number;
}

// For updating modules (all fields optional except id)
export interface PVModuleUpdate {
  name?: string;
  voc?: number;
  isc?: number;
  vmp?: number;
  imp?: number;
  ns?: number;
  kv?: number;
  ki?: number;
  celltype?: string;
  gamma_pmp?: number;
}

// API response for module operations
export interface PVModuleResponse extends PVModule {}

// Delete operation response
export interface DeleteResponse {
  detail: string;
}

// Simulation-related interfaces
export interface SimulationInput {
  module_id: number;
  use_environmental_conditions?: boolean;
  irradiance?: number;  // W/m²
  temperature?: number; // °C
}

export interface SimulationSummary {
  Voc: number;
  Isc: number;
  Vmp: number;
  Imp: number;
  Pmp: number;
}

export interface SimulationResponse {
  module_id: number;
  mode: string;
  irradiance: number;
  temperature: number;
  iv_curve: number[][]; // Array of [voltage, current] pairs
  pv_curve: number[][]; // Array of [voltage, power] pairs
  summary: SimulationSummary;
}

// Legacy interface (for backward compatibility)
export interface SimulationData {
  voltage: number[];
  current: number[];
  power: number[];
  voc: number;
  isc: number;
  vmp: number;
  imp: number;
  pmp: number;
}

// Query parameters for getting modules
export interface ModuleQueryParams {
  skip?: number;
  limit?: number;
}