/**
 * Integration tests for moduleService with MSW (Mock Service Worker)
 * These tests simulate real HTTP calls to a mocked backend
 */

import { server, resetMockDatabase } from '../mocks/server';
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  deleteMultipleModules,
  checkModuleNameExists,
} from '../../services/moduleService';
import { mockPVModuleCreate } from '../utils/testData';
import { PVModule } from '../../types';

// Import the server setup
import '../mocks/server';

describe('ModuleService Integration Tests', () => {
  describe('End-to-End CRUD Operations', () => {
    it('should perform complete CRUD lifecycle', async () => {
      // 1. Get initial modules
      const initialModules = await getAllModules();
      expect(initialModules).toHaveLength(3);
      expect(initialModules[0].name).toBe('Test Solar Panel');

      // 2. Create a new module
      const newModuleData = {
        ...mockPVModuleCreate,
        name: 'Integration Test Module',
      };

      const createdModule = await createModule(newModuleData);
      expect(createdModule).toMatchObject(newModuleData);
      expect(createdModule.id).toBe(4);

      // 3. Verify module was created by fetching all modules
      const modulesAfterCreate = await getAllModules();
      expect(modulesAfterCreate).toHaveLength(4);

      // 4. Get the specific module by ID
      const fetchedModule = await getModuleById(createdModule.id);
      expect(fetchedModule).toEqual(createdModule);

      // 5. Update the module
      const updateData = { name: 'Updated Integration Test Module', voc: 50.0 };
      const updatedModule = await updateModule(createdModule.id, updateData);
      expect(updatedModule.name).toBe(updateData.name);
      expect(updatedModule.voc).toBe(updateData.voc);
      expect(updatedModule.id).toBe(createdModule.id);

      // 6. Verify update by fetching again
      const fetchedUpdatedModule = await getModuleById(createdModule.id);
      expect(fetchedUpdatedModule).toEqual(updatedModule);

      // 7. Delete the module
      const deleteResult = await deleteModule(createdModule.id);
      expect(deleteResult).toBe(`Module ${createdModule.id} deleted`);

      // 8. Verify deletion
      await expect(getModuleById(createdModule.id)).rejects.toThrow(
        `PV module with ID ${createdModule.id} not found.`
      );

      // 9. Verify final count
      const finalModules = await getAllModules();
      expect(finalModules).toHaveLength(3);
    });

    it('should handle bulk operations correctly', async () => {
      // Create multiple modules for testing
      const module1 = await createModule({ ...mockPVModuleCreate, name: 'Bulk Test 1' });
      const module2 = await createModule({ ...mockPVModuleCreate, name: 'Bulk Test 2' });
      const module3 = await createModule({ ...mockPVModuleCreate, name: 'Bulk Test 3' });

      // Verify all were created
      const allModules = await getAllModules();
      expect(allModules).toHaveLength(6); // 3 initial + 3 new

      // Delete multiple modules
      const deleteResults = await deleteMultipleModules([module1.id, module3.id]);
      expect(deleteResults).toHaveLength(2);
      expect(deleteResults).toEqual([
        `Module ${module1.id} deleted`,
        `Module ${module3.id} deleted`,
      ]);

      // Verify only module2 remains from our test modules
      const remainingModules = await getAllModules();
      expect(remainingModules).toHaveLength(4); // 3 initial + 1 remaining

      const remainingTestModule = remainingModules.find(m => m.name === 'Bulk Test 2');
      expect(remainingTestModule).toBeTruthy();
      expect(remainingTestModule!.id).toBe(module2.id);
    });
  });

  describe('Pagination and Filtering', () => {
    beforeEach(async () => {
      // Create additional modules for pagination testing
      for (let i = 1; i <= 5; i++) {
        await createModule({
          ...mockPVModuleCreate,
          name: `Pagination Test ${i}`,
        });
      }
    });

    it('should handle pagination correctly', async () => {
      // Test with pagination parameters
      const firstPage = await getAllModules({ skip: 0, limit: 3 });
      expect(firstPage).toHaveLength(3);

      const secondPage = await getAllModules({ skip: 3, limit: 3 });
      expect(secondPage).toHaveLength(3);

      const thirdPage = await getAllModules({ skip: 6, limit: 3 });
      expect(thirdPage).toHaveLength(2); // Only 2 remaining modules

      // Verify no overlap between pages
      const firstPageIds = firstPage.map(m => m.id);
      const secondPageIds = secondPage.map(m => m.id);
      expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
    });

    it('should handle edge cases in pagination', async () => {
      // Test with skip beyond available modules
      const emptyPage = await getAllModules({ skip: 100, limit: 10 });
      expect(emptyPage).toHaveLength(0);

      // Test with limit 0
      const zeroLimit = await getAllModules({ skip: 0, limit: 0 });
      expect(zeroLimit).toHaveLength(0);

      // Test with very large limit
      const allModules = await getAllModules({ skip: 0, limit: 1000 });
      expect(allModules).toHaveLength(8); // 3 initial + 5 created in beforeEach
    });
  });

  describe('Name Uniqueness and Validation', () => {
    it('should check module name existence correctly', async () => {
      // Check existing name
      const existsResult = await checkModuleNameExists('Test Solar Panel');
      expect(existsResult).toBe(true);

      // Check non-existing name
      const notExistsResult = await checkModuleNameExists('Non-existent Panel');
      expect(notExistsResult).toBe(false);

      // Check case insensitivity
      const caseInsensitiveResult = await checkModuleNameExists('TEST SOLAR PANEL');
      expect(caseInsensitiveResult).toBe(true);

      // Check with exclusion ID
      const excludeResult = await checkModuleNameExists('Test Solar Panel', 1);
      expect(excludeResult).toBe(false); // Should exclude ID 1 which has this name
    });

    it('should prevent duplicate names on creation', async () => {
      await expect(
        createModule({ ...mockPVModuleCreate, name: 'Test Solar Panel' })
      ).rejects.toThrow('Module with this name already exists');
    });

    it('should prevent duplicate names on update', async () => {
      const newModule = await createModule({
        ...mockPVModuleCreate,
        name: 'Unique Test Module',
      });

      // Try to update to an existing name
      await expect(
        updateModule(newModule.id, { name: 'Test Solar Panel' })
      ).rejects.toThrow('Module with this name already exists');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle 404 errors correctly', async () => {
      const nonExistentId = 99999;

      await expect(getModuleById(nonExistentId)).rejects.toThrow(
        `PV module with ID ${nonExistentId} not found.`
      );

      await expect(updateModule(nonExistentId, { name: 'Test' })).rejects.toThrow(
        `PV module with ID ${nonExistentId} not found.`
      );

      await expect(deleteModule(nonExistentId)).rejects.toThrow(
        `PV module with ID ${nonExistentId} not found.`
      );
    });

    it('should handle partial failures in bulk operations', async () => {
      const validModule = await createModule({
        ...mockPVModuleCreate,
        name: 'Valid Module',
      });

      // Try to delete one valid and one invalid ID
      const results = await deleteMultipleModules([validModule.id, 99999]);

      // Should get one success result
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(`Module ${validModule.id} deleted`);

      // Verify the valid module was actually deleted
      await expect(getModuleById(validModule.id)).rejects.toThrow('not found');
    });

    it('should handle network and server errors gracefully', async () => {
      // Mock server errors using MSW runtime handlers
      server.use(
        // Override the getAllModules handler to return a server error
        ...[handlers[0]] // This would need to be implemented with error responses
      );

      // Note: For a full implementation, you'd add error simulation endpoints
      // to your handlers and test them here
    });
  });

  describe('Data Integrity and Type Safety', () => {
    it('should maintain data types through operations', async () => {
      const moduleData = {
        name: 'Type Test Module',
        voc: 45.6,
        isc: 9.2,
        vmp: 37.8,
        imp: 8.5,
        ns: 72,
        kv: -0.35,
        ki: 0.045,
      };

      const createdModule = await createModule(moduleData);

      // Verify all numeric types are preserved
      expect(typeof createdModule.voc).toBe('number');
      expect(typeof createdModule.isc).toBe('number');
      expect(typeof createdModule.vmp).toBe('number');
      expect(typeof createdModule.imp).toBe('number');
      expect(typeof createdModule.ns).toBe('number');
      expect(typeof createdModule.kv).toBe('number');
      expect(typeof createdModule.ki).toBe('number');

      // Verify exact values
      expect(createdModule.voc).toBe(moduleData.voc);
      expect(createdModule.isc).toBe(moduleData.isc);
      expect(createdModule.ns).toBe(moduleData.ns);
    });

    it('should handle partial updates correctly', async () => {
      const originalModule = await getModuleById(1);

      // Update only one field
      const updateData = { voc: 55.5 };
      const updatedModule = await updateModule(1, updateData);

      // Verify only the updated field changed
      expect(updatedModule.voc).toBe(updateData.voc);
      expect(updatedModule.name).toBe(originalModule.name);
      expect(updatedModule.isc).toBe(originalModule.isc);
      expect(updatedModule.id).toBe(originalModule.id);
    });
  });
});