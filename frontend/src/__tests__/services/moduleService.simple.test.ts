/**
 * Simplified unit tests for moduleService using manual mocks
 * This avoids ES6 module issues with axios-mock-adapter and MSW
 */

import { PVModule, PVModuleCreate } from '../../types';
import { mockPVModule, mockPVModuleCreate, invalidPVModuleCreate } from '../utils/testData';

// Mock the entire API module
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
}));

// Import after mocking
import * as api from '../../services/api';
import {
  getAllModules,
  createModule,
  updateModule,
  deleteModule,
  getModuleById,
  checkModuleNameExists,
  simulateIVCurve,
} from '../../services/moduleService';

const mockApi = api as jest.Mocked<typeof api>;

describe('ModuleService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllModules', () => {
    it('should return modules from API', async () => {
      const mockModules = [mockPVModule];
      mockApi.get.mockResolvedValue({ data: mockModules } as any);

      const result = await getAllModules();

      expect(result).toEqual(mockModules);
      expect(mockApi.get).toHaveBeenCalledWith('/modules', { params: {} });
    });

    it('should pass pagination parameters', async () => {
      const params = { skip: 10, limit: 20 };
      mockApi.get.mockResolvedValue({ data: [] } as any);

      await getAllModules(params);

      expect(mockApi.get).toHaveBeenCalledWith('/modules', { params });
    });

    it('should handle API errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      await expect(getAllModules()).rejects.toThrow('Failed to load PV modules. Please try again.');
    });
  });

  describe('getModuleById', () => {
    it('should return a specific module', async () => {
      mockApi.get.mockResolvedValue({ data: mockPVModule } as any);

      const result = await getModuleById(1);

      expect(result).toEqual(mockPVModule);
      expect(mockApi.get).toHaveBeenCalledWith('/modules/1');
    });

    it('should handle 404 errors', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockApi.get.mockRejectedValue(error);

      await expect(getModuleById(999)).rejects.toThrow('PV module with ID 999 not found.');
    });
  });

  describe('createModule', () => {
    it('should create a module successfully', async () => {
      const newModule = { ...mockPVModuleCreate, id: 4 };
      mockApi.post.mockResolvedValue({ data: newModule } as any);

      const result = await createModule(mockPVModuleCreate);

      expect(result).toEqual(newModule);
      expect(mockApi.post).toHaveBeenCalledWith('/modules', mockPVModuleCreate);
    });

    it('should validate required fields', async () => {
      const invalidData = { ...mockPVModuleCreate, name: '' } as any;

      await expect(createModule(invalidData)).rejects.toThrow('Missing required fields: name');
    });

    it('should validate numeric values', async () => {
      const invalidData = { ...mockPVModuleCreate, voc: 'invalid' } as any;

      await expect(createModule(invalidData)).rejects.toThrow('Invalid numeric values for: voc');
    });

    it('should validate positive values', async () => {
      const invalidData = { ...mockPVModuleCreate, voc: -1 };

      await expect(createModule(invalidData)).rejects.toThrow('Values must be positive for: voc');
    });

    it('should validate integer values for ns', async () => {
      const invalidData = { ...mockPVModuleCreate, ns: 60.5 };

      await expect(createModule(invalidData)).rejects.toThrow('Number of cells in series (ns) must be a positive integer.');
    });
  });

  describe('updateModule', () => {
    it('should update a module successfully', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedModule = { ...mockPVModule, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedModule } as any);

      const result = await updateModule(1, updateData);

      expect(result).toEqual(updatedModule);
      expect(mockApi.put).toHaveBeenCalledWith('/modules/1', updateData);
    });

    it('should validate numeric values when provided', async () => {
      const invalidUpdate = { voc: 'not_a_number' as any };

      await expect(updateModule(1, invalidUpdate)).rejects.toThrow('Invalid numeric values for: voc');
    });
  });

  describe('deleteModule', () => {
    it('should delete a module successfully', async () => {
      const deleteResponse = { detail: 'Module 1 deleted' };
      mockApi.del.mockResolvedValue({ data: deleteResponse } as any);

      const result = await deleteModule(1);

      expect(result).toBe('Module 1 deleted');
      expect(mockApi.del).toHaveBeenCalledWith('/modules/1');
    });

    it('should handle 404 errors', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockApi.del.mockRejectedValue(error);

      await expect(deleteModule(999)).rejects.toThrow('PV module with ID 999 not found.');
    });
  });

  describe('checkModuleNameExists', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: [
          { id: 1, name: 'Test Solar Panel' },
          { id: 2, name: 'Another Panel' }
        ]
      } as any);
    });

    it('should return true if name exists', async () => {
      const result = await checkModuleNameExists('Test Solar Panel');
      expect(result).toBe(true);
    });

    it('should return false if name does not exist', async () => {
      const result = await checkModuleNameExists('Nonexistent Panel');
      expect(result).toBe(false);
    });

    it('should be case insensitive', async () => {
      const result = await checkModuleNameExists('TEST SOLAR PANEL');
      expect(result).toBe(true);
    });

    it('should exclude specific ID when checking', async () => {
      const result = await checkModuleNameExists('Test Solar Panel', 1);
      expect(result).toBe(false);
    });

    it('should return false if API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      const result = await checkModuleNameExists('Test Panel');

      expect(result).toBe(false);
    });
  });

  describe('simulateIVCurve', () => {
    const mockSimulationResponse = {
      voltage: [0, 10, 20, 30, 40],
      current: [8.5, 8.2, 7.8, 6.5, 0],
      power: [0, 82, 156, 195, 0],
      voc: 40.2,
      isc: 8.5,
      vmp: 32.5,
      imp: 7.8,
      pmp: 254
    };

    it('should simulate IV curve with default parameters', async () => {
      mockApi.post.mockResolvedValue({ data: mockSimulationResponse } as any);

      const result = await simulateIVCurve({ module_id: 1 });

      expect(result).toEqual(mockSimulationResponse);
      expect(mockApi.post).toHaveBeenCalledWith('/simulate_iv_curve/', {
        module_id: 1,
        use_environmental_conditions: false,
        temperature: undefined,
        irradiance: undefined
      });
    });

    it('should simulate IV curve with custom parameters', async () => {
      mockApi.post.mockResolvedValue({ data: mockSimulationResponse } as any);

      const result = await simulateIVCurve({
        module_id: 1,
        temperature: 50,
        irradiance: 800
      });

      expect(result).toEqual(mockSimulationResponse);
      expect(mockApi.post).toHaveBeenCalledWith('/simulate_iv_curve/', {
        module_id: 1,
        use_environmental_conditions: true,
        temperature: 50,
        irradiance: 800
      });
    });

    it('should validate temperature range', async () => {
      await expect(simulateIVCurve({
        module_id: 1,
        temperature: -50
      })).rejects.toThrow('Temperature must be between -40°C and 85°C');

      await expect(simulateIVCurve({
        module_id: 1,
        temperature: 100
      })).rejects.toThrow('Temperature must be between -40°C and 85°C');
    });

    it('should validate irradiance range', async () => {
      await expect(simulateIVCurve({
        module_id: 1,
        irradiance: -100
      })).rejects.toThrow('Irradiance must be between 0 and 1500 W/m²');

      await expect(simulateIVCurve({
        module_id: 1,
        irradiance: 2000
      })).rejects.toThrow('Irradiance must be between 0 and 1500 W/m²');
    });

    it('should handle 404 errors for nonexistent module', async () => {
      const error: any = new Error('Not found');
      error.response = { status: 404 };
      mockApi.post.mockRejectedValue(error);

      await expect(simulateIVCurve({ module_id: 999 })).rejects.toThrow('PV module with ID 999 not found.');
    });

    it('should handle 500 errors for simulation failures', async () => {
      const error: any = new Error('Server error');
      error.response = { status: 500, data: { detail: 'SDM parameter extraction failed' } };
      mockApi.post.mockRejectedValue(error);

      await expect(simulateIVCurve({ module_id: 1 })).rejects.toThrow('Simulation error: SDM parameter extraction failed');
    });

    it('should handle validation errors from backend', async () => {
      const error: any = new Error('Validation error');
      error.response = { status: 422, data: { detail: 'Invalid module parameters' } };
      mockApi.post.mockRejectedValue(error);

      await expect(simulateIVCurve({ module_id: 1 })).rejects.toThrow('Failed to generate IV curve simulation. Please try again.');
    });

    it('should handle generic network errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Network timeout'));

      await expect(simulateIVCurve({ module_id: 1 })).rejects.toThrow('Failed to generate IV curve simulation. Please try again.');
    });
  });
});