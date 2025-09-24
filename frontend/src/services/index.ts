// Service layer exports - centralized API access for all components

// Core API client
export { default as api } from './api';
export { get, post, put, del, patch } from './api';

// PV Module service functions
export {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  deleteMultipleModules,
  checkModuleNameExists,
  simulateIVCurve,
} from './moduleService';

// Types (re-export for convenience)
export type {
  PVModule,
  PVModuleCreate,
  PVModuleUpdate,
  PVModuleResponse,
  DeleteResponse,
  ModuleQueryParams,
  SimulationInput,
  SimulationResponse,
  SimulationSummary,
  SimulationData,
} from '../types';