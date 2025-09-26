import { get, post, put, del } from './api';
import {
  PVModule,
  PVModuleCreate,
  PVModuleUpdate,
  PVModuleResponse,
  DeleteResponse,
  ModuleQueryParams,
  SimulationInput,
  SimulationResponse,
  VALID_CELLTYPES,
} from '../types';

/**
 * PV Module Service - All CRUD operations for PV modules
 * Based on FastAPI endpoints in /backend/main.py
 */

/**
 * Get all PV modules with optional pagination
 * GET /modules
 */
export const getAllModules = async (params?: ModuleQueryParams): Promise<PVModule[]> => {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.skip !== undefined) queryParams.skip = params.skip;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    const response = await get<PVModule[]>('/modules', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    throw new Error('Failed to load PV modules. Please try again.');
  }
};

/**
 * Get a specific PV module by ID
 * GET /modules/{module_id}
 */
export const getModuleById = async (moduleId: number): Promise<PVModule> => {
  try {
    const response = await get<PVModuleResponse>(`/modules/${moduleId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`PV module with ID ${moduleId} not found.`);
    }
    console.error(`Failed to fetch module ${moduleId}:`, error);
    throw new Error('Failed to load PV module. Please try again.');
  }
};

/**
 * Create a new PV module
 * POST /modules
 */
export const createModule = async (moduleData: PVModuleCreate): Promise<PVModule> => {
  try {
    // Validate required fields
    const requiredFields: (keyof PVModuleCreate)[] = ['name', 'voc', 'isc', 'vmp', 'imp', 'ns', 'kv', 'ki', 'celltype', 'gamma_pmp'];
    const missingFields = requiredFields.filter(field =>
      moduleData[field] === undefined || moduleData[field] === null || moduleData[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate numeric values
    const numericFields: (keyof PVModuleCreate)[] = ['voc', 'isc', 'vmp', 'imp', 'ns', 'kv', 'ki', 'gamma_pmp'];
    const invalidFields = numericFields.filter(field =>
      typeof moduleData[field] !== 'number' || isNaN(moduleData[field] as number)
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid numeric values for: ${invalidFields.join(', ')}`);
    }

    // Validate positive values where appropriate
    const positiveFields: (keyof PVModuleCreate)[] = ['voc', 'isc', 'vmp', 'imp'];
    const negativeFields = positiveFields.filter(field => (moduleData[field] as number) <= 0);

    if (negativeFields.length > 0) {
      throw new Error(`Values must be positive for: ${negativeFields.join(', ')}`);
    }

    // Validate integer values
    if (!Number.isInteger(moduleData.ns) || moduleData.ns <= 0) {
      throw new Error('Number of cells in series (ns) must be a positive integer.');
    }

    // Validate celltype
    if (!VALID_CELLTYPES.includes(moduleData.celltype as any)) {
      throw new Error(`Invalid celltype. Must be one of: ${VALID_CELLTYPES.join(', ')}`);
    }

    const response = await post<PVModuleResponse, PVModuleCreate>('/modules', moduleData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const detail = error.response.data?.detail || 'Bad request';
      throw new Error(detail);
    }
    if (error.message.includes('Missing required fields') ||
        error.message.includes('Invalid numeric values') ||
        error.message.includes('Values must be positive') ||
        error.message.includes('Number of cells')) {
      throw error; // Re-throw validation errors as-is
    }
    console.error('Failed to create module:', error);
    throw new Error('Failed to create PV module. Please check your input and try again.');
  }
};

/**
 * Update an existing PV module
 * PUT /modules/{module_id}
 */
export const updateModule = async (moduleId: number, updateData: PVModuleUpdate): Promise<PVModule> => {
  try {
    // Validate numeric values if provided
    const numericFields: (keyof PVModuleUpdate)[] = ['voc', 'isc', 'vmp', 'imp', 'ns', 'kv', 'ki', 'gamma_pmp'];
    const invalidFields = numericFields.filter(field =>
      updateData[field] !== undefined &&
      (typeof updateData[field] !== 'number' || isNaN(updateData[field] as number))
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid numeric values for: ${invalidFields.join(', ')}`);
    }

    // Validate positive values where appropriate
    const positiveFields: (keyof PVModuleUpdate)[] = ['voc', 'isc', 'vmp', 'imp'];
    const negativeFields = positiveFields.filter(field =>
      updateData[field] !== undefined && (updateData[field] as number) <= 0
    );

    if (negativeFields.length > 0) {
      throw new Error(`Values must be positive for: ${negativeFields.join(', ')}`);
    }

    // Validate integer values for ns
    if (updateData.ns !== undefined && (!Number.isInteger(updateData.ns) || updateData.ns <= 0)) {
      throw new Error('Number of cells in series (ns) must be a positive integer.');
    }

    // Validate celltype if provided
    if (updateData.celltype !== undefined && !VALID_CELLTYPES.includes(updateData.celltype as any)) {
      throw new Error(`Invalid celltype. Must be one of: ${VALID_CELLTYPES.join(', ')}`);
    }

    const response = await put<PVModuleResponse, PVModuleUpdate>(`/modules/${moduleId}`, updateData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`PV module with ID ${moduleId} not found.`);
    }
    if (error.response?.status === 400) {
      const detail = error.response.data?.detail || 'Bad request';
      throw new Error(detail);
    }
    if (error.message.includes('Invalid numeric values') ||
        error.message.includes('Values must be positive') ||
        error.message.includes('Number of cells')) {
      throw error; // Re-throw validation errors as-is
    }
    console.error(`Failed to update module ${moduleId}:`, error);
    throw new Error('Failed to update PV module. Please try again.');
  }
};

/**
 * Delete a PV module by ID
 * DELETE /modules/{module_id}
 */
export const deleteModule = async (moduleId: number): Promise<string> => {
  try {
    const response = await del<DeleteResponse>(`/modules/${moduleId}`);
    return response.data.detail;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`PV module with ID ${moduleId} not found.`);
    }
    console.error(`Failed to delete module ${moduleId}:`, error);
    throw new Error('Failed to delete PV module. Please try again.');
  }
};

/**
 * Delete multiple PV modules by IDs
 * Convenience function for bulk operations
 */
export const deleteMultipleModules = async (moduleIds: number[]): Promise<string[]> => {
  try {
    const deletePromises = moduleIds.map(id => deleteModule(id));
    const results = await Promise.allSettled(deletePromises);

    const successResults: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successResults.push(result.value);
      } else {
        errors.push(`Module ${moduleIds[index]}: ${result.reason.message}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Some deletions failed:', errors);
      // Still return successful deletions, but log errors
    }

    return successResults;
  } catch (error) {
    console.error('Failed to delete multiple modules:', error);
    throw new Error('Failed to delete PV modules. Please try again.');
  }
};

/**
 * Check if a module name already exists
 * Convenience function for form validation
 */
export const checkModuleNameExists = async (name: string, excludeId?: number): Promise<boolean> => {
  try {
    const modules = await getAllModules();
    return modules.some(module =>
      module.name.toLowerCase() === name.toLowerCase() && module.id !== excludeId
    );
  } catch (error) {
    console.error('Failed to check module name:', error);
    // If we can't check, assume it doesn't exist to allow user to proceed
    return false;
  }
};

/**
 * Simulate IV curve for a PV module with environmental conditions
 * POST /simulate_iv_curve/
 */
export const simulateIVCurve = async ({
  module_id,
  temperature,
  irradiance
}: {
  module_id: number;
  temperature?: number;
  irradiance?: number;
}): Promise<SimulationResponse> => {
  try {
    // Validate inputs
    if (!Number.isInteger(module_id) || module_id <= 0) {
      throw new Error('Module ID must be a positive integer.');
    }

    if (temperature !== undefined) {
      if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number.');
      }
      if (temperature < -40 || temperature > 85) {
        throw new Error('Temperature must be between -40°C and 85°C.');
      }
    }

    if (irradiance !== undefined) {
      if (typeof irradiance !== 'number' || isNaN(irradiance)) {
        throw new Error('Irradiance must be a valid number.');
      }
      if (irradiance < 0 || irradiance > 1500) {
        throw new Error('Irradiance must be between 0 and 1500 W/m².');
      }
    }

    // Prepare simulation input
    const simulationInput: SimulationInput = {
      module_id,
      use_environmental_conditions: temperature !== undefined || irradiance !== undefined,
      temperature,
      irradiance,
    };

    const response = await post<SimulationResponse, SimulationInput>('/simulate_iv_curve/', simulationInput);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`PV module with ID ${module_id} not found.`);
    }
    if (error.response?.status === 500) {
      const detail = error.response.data?.detail || 'Simulation failed';
      throw new Error(`Simulation error: ${detail}`);
    }
    if (error.message.includes('Temperature must be') ||
        error.message.includes('Irradiance must be') ||
        error.message.includes('Module ID must be')) {
      throw error; // Re-throw validation errors as-is
    }
    console.error(`Failed to simulate IV curve for module ${module_id}:`, error);
    throw new Error('Failed to generate IV curve simulation. Please try again.');
  }
};