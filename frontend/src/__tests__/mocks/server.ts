import { setupServer } from 'msw/node';
import { handlers, resetMockDatabase } from './handlers';

// Setup mock server with our handlers
export const server = setupServer(...handlers);

// Server lifecycle hooks
beforeAll(() => {
  // Start the server before all tests
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  // Reset the mock database before each test
  resetMockDatabase();
});

afterEach(() => {
  // Reset any runtime request handlers we may have added during tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up and close the server after all tests
  server.close();
});

export { resetMockDatabase };