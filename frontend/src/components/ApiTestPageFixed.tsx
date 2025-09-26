import React, { useState, useCallback } from 'react';

interface ApiTestResult {
  operation: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

interface PVModuleCreate {
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

const ApiTestPageFixed: React.FC = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const addResult = useCallback((operation: string, success: boolean, data?: any, error?: string) => {
    const result: ApiTestResult = {
      operation,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults(prev => [result, ...prev]);
  }, []);

  // Simple fetch-based API calls (avoiding axios import issues)
  const apiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: any) => {
    const baseUrl = 'http://127.0.0.1:8000';
    const url = `${baseUrl}${endpoint}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return await response.json();
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFn();
      addResult(testName, true, result);
      return result;
    } catch (error: any) {
      addResult(testName, false, null, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Test functions using direct fetch
  const testBackendConnection = () => runTest('Backend Connection', async () => {
    const result = await apiCall('GET', '/');
    setBackendStatus('online');
    return result;
  });

  const testGetAllModules = () => runTest('Get All Modules', async () => {
    return await apiCall('GET', '/modules');
  });

  const testGetModuleById = () => runTest('Get Module By ID', async () => {
    return await apiCall('GET', '/modules/1');
  });

  const testCreateModule = () => runTest('Create Module', async () => {
    const sampleModule: PVModuleCreate = {
      name: `Test Module ${Date.now()}`,
      voc: 36.3,
      isc: 8.85,
      vmp: 29.4,
      imp: 8.5,
      ns: 60,
      kv: -0.32,
      ki: 0.06,
      celltype: 'monoSi',
      gamma_pmp: -0.35,
    };
    return await apiCall('POST', '/modules', sampleModule);
  });

  const testUpdateModule = () => runTest('Update Module', async () => {
    const updateData = { name: `Updated Module ${Date.now()}` };
    return await apiCall('PUT', '/modules/1', updateData);
  });

  const testDeleteModule = () => runTest('Delete Module', async () => {
    // First create a test module to delete
    const moduleToDelete = await apiCall('POST', '/modules', {
      name: `Temp Delete Test ${Date.now()}`,
      voc: 36.3, isc: 8.85, vmp: 29.4, imp: 8.5, ns: 60, kv: -0.32, ki: 0.06,
      celltype: 'monoSi', gamma_pmp: -0.35
    });
    // Then delete it
    return await apiCall('DELETE', `/modules/${moduleToDelete.id}`);
  });

  const testSimulateIVCurve = () => runTest('Simulate IV Curve', async () => {
    // Use default parameters (temperature: 25°C, irradiance: 1000 W/m²)
    return await apiCall('POST', '/simulate_iv_curve/', {
      module_id: 1,
      temperature: 25,
      irradiance: 1000
    });
  });

  const testSimulateCustomConditions = () => runTest('Simulate Custom Conditions', async () => {
    // Test with hot temperature and low irradiance
    return await apiCall('POST', '/simulate_iv_curve/', {
      module_id: 1,
      temperature: 50,
      irradiance: 500
    });
  });

  const testErrorScenarios = () => runTest('Error Scenarios', async () => {
    const errors = [];

    // Test 404 error for module
    try {
      await apiCall('GET', '/modules/99999');
    } catch (error: any) {
      errors.push(`404 Module Test: ${error.message}`);
    }

    // Test invalid module data
    try {
      await apiCall('POST', '/modules', { invalid: 'data' });
    } catch (error: any) {
      errors.push(`Module Validation Test: ${error.message}`);
    }

    // Test simulation with invalid module ID
    try {
      await apiCall('POST', '/simulate_iv_curve/', { module_id: 99999 });
    } catch (error: any) {
      errors.push(`Simulation 404 Test: ${error.message}`);
    }

    // Test simulation with invalid parameters
    try {
      await apiCall('POST', '/simulate_iv_curve/', {
        module_id: 1,
        temperature: 150, // Invalid temperature
        irradiance: -100  // Invalid irradiance
      });
    } catch (error: any) {
      errors.push(`Simulation Validation Test: ${error.message}`);
    }

    return { errors, message: 'Error scenario tests completed' };
  });

  const clearResults = () => setResults([]);

  const runAllTests = async () => {
    clearResults();
    try {
      await testBackendConnection();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testGetAllModules();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testGetModuleById();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testCreateModule();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testUpdateModule();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testDeleteModule();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testSimulateIVCurve();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testSimulateCustomConditions();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testErrorScenarios();

      addResult('All Tests Complete', true, { message: 'All tests completed' });
    } catch (error) {
      addResult('Test Suite Failed', false, null, 'Test suite was interrupted');
    }
  };

  // Check backend status on component mount
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiCall('GET', '/');
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">API Service Test Page (Fixed)</h1>
          <p className="text-slate-600 mb-4">
            Direct API testing with simple fetch calls (no import issues)
          </p>

          {/* Backend Status */}
          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Backend Status</h2>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' :
                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="font-medium">
                {backendStatus === 'online' ? '✅ Backend Online' :
                 backendStatus === 'offline' ? '❌ Backend Offline' : '🔄 Checking...'}
              </span>
              <code className="bg-slate-200 px-2 py-1 rounded text-sm">http://127.0.0.1:8000</code>
            </div>

            {backendStatus === 'offline' && (
              <div className="mt-3 p-3 bg-red-50 rounded border-l-4 border-red-400">
                <p className="text-red-700 text-sm font-medium">Backend Not Running</p>
                <p className="text-red-600 text-sm mt-1">
                  Start your FastAPI server: <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload</code>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Test Controls</h2>

            {/* Connection Test */}
            <div className="mb-4 pb-4 border-b">
              <h3 className="font-semibold text-slate-700 mb-2">Connection Test</h3>
              <button
                onClick={testBackendConnection}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full"
              >
                Test Backend Connection
              </button>
            </div>

            {/* API Tests */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={testGetAllModules}
                disabled={loading || backendStatus !== 'online'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get All Modules
              </button>

              <button
                onClick={testGetModuleById}
                disabled={loading || backendStatus !== 'online'}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Module by ID
              </button>

              <button
                onClick={testCreateModule}
                disabled={loading || backendStatus !== 'online'}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Module
              </button>

              <button
                onClick={testUpdateModule}
                disabled={loading || backendStatus !== 'online'}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Update Module
              </button>

              <button
                onClick={testDeleteModule}
                disabled={loading || backendStatus !== 'online'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Module
              </button>

              <button
                onClick={testSimulateIVCurve}
                disabled={loading || backendStatus !== 'online'}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Simulate IV Curve
              </button>

              <button
                onClick={testSimulateCustomConditions}
                disabled={loading || backendStatus !== 'online'}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Custom Conditions
              </button>

              <button
                onClick={testErrorScenarios}
                disabled={loading || backendStatus !== 'online'}
                className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors col-span-2"
              >
                Test All Error Scenarios
              </button>
            </div>

            {/* Master Controls */}
            <div className="border-t pt-4 flex gap-3">
              <button
                onClick={runAllTests}
                disabled={loading || backendStatus !== 'online'}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex-1"
              >
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </button>

              <button
                onClick={clearResults}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Clear Results
              </button>
            </div>

            {loading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Running test...
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Test Results</h2>

            {results.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tests run yet. Click a test button to begin.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '✅' : '❌'} {result.operation}
                      </h3>
                      <span className="text-xs text-slate-500">{result.timestamp}</span>
                    </div>

                    {result.error && (
                      <div className="text-red-700 text-sm mb-2 font-mono bg-red-100 p-2 rounded">
                        {result.error}
                      </div>
                    )}

                    {result.data && (
                      <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold">Expected Backend URL:</h3>
              <code className="bg-slate-100 p-1 rounded">http://127.0.0.1:8000</code>
            </div>
            <div>
              <h3 className="font-semibold">Frontend URL:</h3>
              <code className="bg-slate-100 p-1 rounded">{window.location.origin}</code>
            </div>
            <div>
              <h3 className="font-semibold">Browser Dev Tools:</h3>
              <p>Press F12 → Network tab to monitor requests</p>
            </div>
            <div>
              <h3 className="font-semibold">CORS:</h3>
              <p>Backend must allow origins from this domain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPageFixed;