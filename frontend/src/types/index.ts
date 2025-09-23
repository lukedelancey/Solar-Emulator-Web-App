// TODO: Define TypeScript interfaces for PV modules, simulation data, and API responses

export interface PVModule {
  id: number;
  name: string;
  voc: number;
  isc: number;
  vmp: number;
  imp: number;
  ns: number;
  kv: number;
  ki: number;
}

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