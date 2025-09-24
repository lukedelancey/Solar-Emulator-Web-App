import MockAdapter from 'axios-mock-adapter';
import api from '../../services/api';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('API Service', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      const token = 'test-jwt-token';
      mockLocalStorage.getItem.mockReturnValue(token);
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      await api.get('/test');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(mockAxios.history.get[0].headers?.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add Authorization header when token does not exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      await api.get('/test');

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(mockAxios.history.get[0].headers?.Authorization).toBeUndefined();
    });

    it('should handle request interceptor errors', async () => {
      // Force an error in the request interceptor
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      await expect(api.get('/test')).rejects.toThrow();
      expect(console.error).toHaveBeenCalledWith('Request interceptor error:', expect.any(Error));
    });
  });

  describe('Response Interceptor', () => {
    beforeEach(() => {
      // Set NODE_ENV to development to enable logging
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      // Reset NODE_ENV
      delete process.env.NODE_ENV;
    });

    it('should log successful responses in development', async () => {
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      await api.get('/test');

      expect(console.log).toHaveBeenCalledWith('✅ GET /test:', 200);
    });

    it('should not log in production', async () => {
      process.env.NODE_ENV = 'production';
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      await api.get('/test');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle and log server error responses', async () => {
      mockAxios.onGet('/test').reply(500, { detail: 'Server error' });

      await expect(api.get('/test')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('❌ GET /test:', {
        status: 500,
        statusText: 'Internal Server Error',
        data: { detail: 'Server error' },
      });
    });

    it('should handle and log network errors', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(api.get('/test')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('❌ Network Error - No response received:', expect.any(Object));
    });

    it('should handle and log request setup errors', async () => {
      // Create a mock that simulates a request setup error
      const errorMessage = 'Request setup error';
      mockAxios.onGet('/test').reply(() => {
        const error = new Error(errorMessage);
        (error as any).config = undefined;
        (error as any).request = undefined;
        throw error;
      });

      await expect(api.get('/test')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('❌ Request Error:', errorMessage);
    });

    it('should clear auth token on 401 errors', async () => {
      mockAxios.onGet('/test').reply(401, { detail: 'Unauthorized' });

      await expect(api.get('/test')).rejects.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(console.warn).toHaveBeenCalledWith('🔐 Unauthorized access - token cleared');
    });

    it('should handle 404 errors without clearing token', async () => {
      mockAxios.onGet('/test').reply(404, { detail: 'Not found' });

      await expect(api.get('/test')).rejects.toThrow();

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('❌ GET /test:', {
        status: 404,
        statusText: 'Not Found',
        data: { detail: 'Not found' },
      });
    });
  });

  describe('API Configuration', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe('http://127.0.0.1:8000');
    });

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should have correct timeout', () => {
      expect(api.defaults.timeout).toBe(20000);
    });
  });

  describe('HTTP Helper Methods', () => {
    it('should make GET request with helper method', async () => {
      mockAxios.onGet('/test').reply(200, { data: 'success' });

      const { get } = await import('../../services/api');
      const response = await get('/test');

      expect(response.data).toEqual({ data: 'success' });
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should make POST request with helper method', async () => {
      const postData = { name: 'test' };
      mockAxios.onPost('/test').reply(201, { id: 1, ...postData });

      const { post } = await import('../../services/api');
      const response = await post('/test', postData);

      expect(response.data).toEqual({ id: 1, ...postData });
      expect(mockAxios.history.post).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(postData);
    });

    it('should make PUT request with helper method', async () => {
      const putData = { name: 'updated' };
      mockAxios.onPut('/test/1').reply(200, { id: 1, ...putData });

      const { put } = await import('../../services/api');
      const response = await put('/test/1', putData);

      expect(response.data).toEqual({ id: 1, ...putData });
      expect(mockAxios.history.put).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(putData);
    });

    it('should make DELETE request with helper method', async () => {
      mockAxios.onDelete('/test/1').reply(200, { detail: 'Deleted' });

      const { del } = await import('../../services/api');
      const response = await del('/test/1');

      expect(response.data).toEqual({ detail: 'Deleted' });
      expect(mockAxios.history.delete).toHaveLength(1);
    });

    it('should make PATCH request with helper method', async () => {
      const patchData = { name: 'patched' };
      mockAxios.onPatch('/test/1').reply(200, { id: 1, ...patchData });

      const { patch } = await import('../../services/api');
      const response = await patch('/test/1', patchData);

      expect(response.data).toEqual({ id: 1, ...patchData });
      expect(mockAxios.history.patch).toHaveLength(1);
      expect(JSON.parse(mockAxios.history.patch[0].data)).toEqual(patchData);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle response without config', async () => {
      const mockError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Server error' },
        },
        config: undefined, // No config
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Request failed',
      };

      mockAxios.onGet('/test').reply(() => Promise.reject(mockError));

      await expect(api.get('/test')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith('❌ undefined undefined:', {
        status: 500,
        statusText: 'Internal Server Error',
        data: { detail: 'Server error' },
      });
    });

    it('should handle 401 response without status property', async () => {
      const mockError = {
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Token expired' },
        },
        config: { method: 'get', url: '/test' },
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Request failed',
      };

      mockAxios.onGet('/test').reply(() => Promise.reject(mockError));

      await expect(api.get('/test')).rejects.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });
});