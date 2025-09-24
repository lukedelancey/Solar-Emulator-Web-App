import { http, HttpResponse } from 'msw';
import { mockPVModuleList, mockPVModule } from '../utils/testData';
import { PVModule, PVModuleCreate } from '../../types';

// Mock data store (simulates database)
let mockDatabase: PVModule[] = [...mockPVModuleList];
let nextId = 4;

export const handlers = [
  // GET /modules - Get all modules
  http.get('http://127.0.0.1:8000/modules', ({ request }) => {
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const paginatedModules = mockDatabase.slice(skip, skip + limit);

    return HttpResponse.json(paginatedModules, { status: 200 });
  }),

  // GET /modules/{id} - Get module by ID
  http.get('http://127.0.0.1:8000/modules/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const module = mockDatabase.find(m => m.id === id);

    if (!module) {
      return HttpResponse.json(
        { detail: 'Module not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(module, { status: 200 });
  }),

  // POST /modules - Create new module
  http.post('http://127.0.0.1:8000/modules', async ({ request }) => {
    const moduleData = await request.json() as PVModuleCreate;

    // Check for duplicate name
    const existingModule = mockDatabase.find(
      m => m.name.toLowerCase() === moduleData.name.toLowerCase()
    );

    if (existingModule) {
      return HttpResponse.json(
        { detail: 'Module with this name already exists' },
        { status: 400 }
      );
    }

    // Create new module
    const newModule: PVModule = {
      id: nextId++,
      ...moduleData,
    };

    mockDatabase.push(newModule);

    return HttpResponse.json(newModule, { status: 201 });
  }),

  // PUT /modules/{id} - Update module
  http.put('http://127.0.0.1:8000/modules/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const updateData = await request.json() as Partial<PVModuleCreate>;

    const moduleIndex = mockDatabase.findIndex(m => m.id === id);

    if (moduleIndex === -1) {
      return HttpResponse.json(
        { detail: 'Module not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (updateData.name) {
      const existingModule = mockDatabase.find(
        m => m.name.toLowerCase() === updateData.name!.toLowerCase() && m.id !== id
      );

      if (existingModule) {
        return HttpResponse.json(
          { detail: 'Module with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update module
    const updatedModule = {
      ...mockDatabase[moduleIndex],
      ...updateData,
    };

    mockDatabase[moduleIndex] = updatedModule;

    return HttpResponse.json(updatedModule, { status: 200 });
  }),

  // DELETE /modules/{id} - Delete module
  http.delete('http://127.0.0.1:8000/modules/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const moduleIndex = mockDatabase.findIndex(m => m.id === id);

    if (moduleIndex === -1) {
      return HttpResponse.json(
        { detail: 'Module not found' },
        { status: 404 }
      );
    }

    mockDatabase.splice(moduleIndex, 1);

    return HttpResponse.json(
      { detail: `Module ${id} deleted` },
      { status: 200 }
    );
  }),

  // Error simulation endpoints for testing
  http.get('http://127.0.0.1:8000/test/network-error', () => {
    return HttpResponse.error();
  }),

  http.get('http://127.0.0.1:8000/test/server-error', () => {
    return HttpResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get('http://127.0.0.1:8000/test/unauthorized', () => {
    return HttpResponse.json(
      { detail: 'Unauthorized' },
      { status: 401 }
    );
  }),
];

// Reset mock database to initial state
export const resetMockDatabase = () => {
  mockDatabase = [...mockPVModuleList];
  nextId = 4;
};

// Get current mock database state
export const getMockDatabase = () => [...mockDatabase];