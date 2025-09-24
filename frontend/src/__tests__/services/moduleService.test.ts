import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  deleteMultipleModules,
  checkModuleNameExists,
} from '../../services/moduleService';
import {
  mockPVModule,
  mockPVModuleList,
  mockPVModuleCreate,
  mockPVModuleUpdate,
  invalidPVModuleCreate,
} from '../utils/testData';

// Create a mock adapter for axios
const mockAxios = new MockAdapter(api);

describe('moduleService', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  describe('getAllModules', () => {
    it('should fetch all modules successfully', async () => {
      mockAxios.onGet('/modules').reply(200, mockPVModuleList);

      const result = await getAllModules();

      expect(result).toEqual(mockPVModuleList);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toBe('/modules');
    });

    it('should fetch modules with pagination parameters', async () => {
      const params = { skip: 10, limit: 20 };
      mockAxios.onGet('/modules').reply(200, mockPVModuleList);

      await getAllModules(params);

      expect(mockAxios.history.get[0].params).toEqual(params);
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.onGet('/modules').reply(500, { detail: 'Server error' });

      await expect(getAllModules()).rejects.toThrow('Failed to load PV modules. Please try again.');
    });

    it('should handle network errors', async () => {
      mockAxios.onGet('/modules').networkError();

      await expect(getAllModules()).rejects.toThrow('Failed to load PV modules. Please try again.');
    });
  });

  describe('getModuleById', () => {
    it('should fetch a module by ID successfully', async () => {
      mockAxios.onGet('/modules/1').reply(200, mockPVModule);

      const result = await getModuleById(1);

      expect(result).toEqual(mockPVModule);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toBe('/modules/1');
    });

    it('should handle 404 errors with specific message', async () => {
      mockAxios.onGet('/modules/999').reply(404, { detail: 'Module not found' });

      await expect(getModuleById(999)).rejects.toThrow('PV module with ID 999 not found.');
    });

    it('should handle other API errors', async () => {
      mockAxios.onGet('/modules/1').reply(500, { detail: 'Server error' });

      await expect(getModuleById(1)).rejects.toThrow('Failed to load PV module. Please try again.');
    });
  });

  describe('createModule', () => {
    it('should create a module successfully', async () => {
      const expectedResult = { ...mockPVModuleCreate, id: 4 };
      mockAxios.onPost('/modules').reply(201, expectedResult);

      const result = await createModule(mockPVModuleCreate);

      expect(result).toEqual(expectedResult);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('/modules');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(mockPVModuleCreate);
    });

    it('should validate required fields', async () => {
      const invalidData = invalidPVModuleCreate.missing_name as any;

      await expect(createModule(invalidData)).rejects.toThrow('Missing required fields: name');
    });

    it('should validate numeric fields', async () => {
      const invalidData = invalidPVModuleCreate.invalid_numeric as any;

      await expect(createModule(invalidData)).rejects.toThrow('Invalid numeric values for: voc');
    });

    it('should validate positive values', async () => {
      const invalidData = invalidPVModuleCreate.negative_values as any;

      await expect(createModule(invalidData)).rejects.toThrow('Values must be positive for: voc');
    });

    it('should validate integer values for ns', async () => {
      const invalidData = invalidPVModuleCreate.invalid_ns as any;

      await expect(createModule(invalidData)).rejects.toThrow('Number of cells in series (ns) must be a positive integer.');
    });

    it('should handle 400 errors from server', async () => {
      mockAxios.onPost('/modules').reply(400, { detail: 'Module with this name already exists' });

      await expect(createModule(mockPVModuleCreate)).rejects.toThrow('Module with this name already exists');
    });

    it('should handle server errors', async () => {
      mockAxios.onPost('/modules').reply(500, { detail: 'Server error' });

      await expect(createModule(mockPVModuleCreate)).rejects.toThrow('Failed to create PV module. Please check your input and try again.');
    });
  });

  describe('updateModule', () => {
    it('should update a module successfully', async () => {
      const expectedResult = { ...mockPVModule, ...mockPVModuleUpdate };
      mockAxios.onPut('/modules/1').reply(200, expectedResult);

      const result = await updateModule(1, mockPVModuleUpdate);

      expect(result).toEqual(expectedResult);
      expect(mockAxios.history.put).toHaveLength(1);
      expect(mockAxios.history.put[0].url).toBe('/modules/1');
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(mockPVModuleUpdate);
    });

    it('should validate numeric fields when provided', async () => {
      const invalidUpdate = { voc: 'not_a_number' as any };

      await expect(updateModule(1, invalidUpdate)).rejects.toThrow('Invalid numeric values for: voc');
    });

    it('should validate positive values when provided', async () => {
      const invalidUpdate = { voc: -10 };

      await expect(updateModule(1, invalidUpdate)).rejects.toThrow('Values must be positive for: voc');
    });

    it('should validate ns as integer when provided', async () => {
      const invalidUpdate = { ns: 60.5 };

      await expect(updateModule(1, invalidUpdate)).rejects.toThrow('Number of cells in series (ns) must be a positive integer.');
    });

    it('should handle 404 errors', async () => {
      mockAxios.onPut('/modules/999').reply(404, { detail: 'Module not found' });

      await expect(updateModule(999, mockPVModuleUpdate)).rejects.toThrow('PV module with ID 999 not found.');
    });

    it('should handle 400 errors from server', async () => {
      mockAxios.onPut('/modules/1').reply(400, { detail: 'Invalid data' });

      await expect(updateModule(1, mockPVModuleUpdate)).rejects.toThrow('Invalid data');
    });
  });

  describe('deleteModule', () => {
    it('should delete a module successfully', async () => {
      const deleteResponse = { detail: 'Module 1 deleted' };
      mockAxios.onDelete('/modules/1').reply(200, deleteResponse);

      const result = await deleteModule(1);

      expect(result).toBe('Module 1 deleted');
      expect(mockAxios.history.delete).toHaveLength(1);
      expect(mockAxios.history.delete[0].url).toBe('/modules/1');
    });

    it('should handle 404 errors', async () => {
      mockAxios.onDelete('/modules/999').reply(404, { detail: 'Module not found' });

      await expect(deleteModule(999)).rejects.toThrow('PV module with ID 999 not found.');
    });

    it('should handle server errors', async () => {
      mockAxios.onDelete('/modules/1').reply(500, { detail: 'Server error' });

      await expect(deleteModule(1)).rejects.toThrow('Failed to delete PV module. Please try again.');
    });
  });

  describe('deleteMultipleModules', () => {
    it('should delete multiple modules successfully', async () => {
      mockAxios.onDelete('/modules/1').reply(200, { detail: 'Module 1 deleted' });
      mockAxios.onDelete('/modules/2').reply(200, { detail: 'Module 2 deleted' });
      mockAxios.onDelete('/modules/3').reply(200, { detail: 'Module 3 deleted' });

      const result = await deleteMultipleModules([1, 2, 3]);

      expect(result).toEqual(['Module 1 deleted', 'Module 2 deleted', 'Module 3 deleted']);
      expect(mockAxios.history.delete).toHaveLength(3);
    });

    it('should handle partial failures', async () => {
      mockAxios.onDelete('/modules/1').reply(200, { detail: 'Module 1 deleted' });
      mockAxios.onDelete('/modules/2').reply(404, { detail: 'Module not found' });
      mockAxios.onDelete('/modules/3').reply(200, { detail: 'Module 3 deleted' });

      const result = await deleteMultipleModules([1, 2, 3]);

      // Should return successful deletions despite one failure
      expect(result).toEqual(['Module 1 deleted', 'Module 3 deleted']);
      expect(console.warn).toHaveBeenCalledWith('Some deletions failed:', ['Module 2: PV module with ID 2 not found.']);
    });

    it('should handle empty array', async () => {
      const result = await deleteMultipleModules([]);

      expect(result).toEqual([]);
      expect(mockAxios.history.delete).toHaveLength(0);
    });
  });

  describe('checkModuleNameExists', () => {
    beforeEach(() => {
      mockAxios.onGet('/modules').reply(200, mockPVModuleList);
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
      // Check if "Test Solar Panel" exists excluding ID 1 (which has that name)
      const result = await checkModuleNameExists('Test Solar Panel', 1);

      expect(result).toBe(false);
    });

    it('should return false if API call fails', async () => {
      mockAxios.reset();
      mockAxios.onGet('/modules').reply(500, { detail: 'Server error' });

      const result = await checkModuleNameExists('Test Panel');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to check module name:', expect.any(Object));
    });
  });
});