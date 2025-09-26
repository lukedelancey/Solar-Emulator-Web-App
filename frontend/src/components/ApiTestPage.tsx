import React, { useState, useCallback } from 'react';
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  deleteMultipleModules,
  checkModuleNameExists,
} from '../services/moduleService';
import { PVModule, PVModuleCreate } from '../types';

interface ApiTestResult {
  operation: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

const ApiTestPage: React.FC = () => {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<PVModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);

  // Sample test data
  const sampleModuleData: PVModuleCreate = {
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

  // Test functions
  const testGetAllModules = () => runTest('Get All Modules', async () => {
    const result = await getAllModules();
    setModules(result);
    return result;
  });

  const testGetModuleById = () => runTest('Get Module By ID', async () => {
    return await getModuleById(selectedModuleId);
  });

  const testCreateModule = () => runTest('Create Module', async () => {
    const result = await createModule(sampleModuleData);
    setModules(prev => [...prev, result]);
    return result;
  });

  const testUpdateModule = () => runTest('Update Module', async () => {
    const updateData = { name: `Updated Module ${Date.now()}` };
    return await updateModule(selectedModuleId, updateData);
  });

  const testDeleteModule = () => runTest('Delete Module', async () => {
    const result = await deleteModule(selectedModuleId);
    setModules(prev => prev.filter(m => m.id !== selectedModuleId));
    return result;
  });

  const testDeleteMultipleModules = () => runTest('Delete Multiple Modules', async () => {
    const idsToDelete = modules.slice(0, 2).map(m => m.id);
    const result = await deleteMultipleModules(idsToDelete);
    setModules(prev => prev.filter(m => !idsToDelete.includes(m.id)));
    return result;
  });

  const testCheckModuleNameExists = () => runTest('Check Module Name Exists', async () => {
    return await checkModuleNameExists('Test Solar Panel');
  });

  const testErrorScenarios = () => runTest('Error Scenarios', async () => {
    const errors = [];

    // Test 404 error
    try {
      await getModuleById(99999);
    } catch (error: any) {
      errors.push(`404 Error: ${error.message}`);
    }

    // Test validation error
    try {
      await createModule({ ...sampleModuleData, voc: -1 } as any);
    } catch (error: any) {
      errors.push(`Validation Error: ${error.message}`);
    }

    return errors;
  });

  const clearResults = () => setResults([]);

  const runAllTests = async () => {
    clearResults();
    try {
      await testGetAllModules();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay between tests

      if (modules.length > 0) {
        await testGetModuleById();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testUpdateModule();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await testCreateModule();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testCheckModuleNameExists();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testErrorScenarios();

      addResult('All Tests Complete', true, { message: 'All tests completed successfully' });
    } catch (error) {
      addResult('Test Suite Failed', false, null, 'Test suite was interrupted');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">API Service Test Page</h1>
          <p className="text-slate-600 mb-4">
            Test the PV Module API service layer with your live backend. Make sure your FastAPI server is running on http://127.0.0.1:8000
          </p>

          {/* Backend Status */}
          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Backend Status</h2>
            <p className="text-sm text-slate-600">
              Expected Backend: <code className="bg-slate-200 px-2 py-1 rounded">http://127.0.0.1:8000</code>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Check your browser's Network tab to monitor HTTP requests
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Test Controls</h2>

            {/* Module Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Test Module ID:
              </label>
              <input
                type="number"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(parseInt(e.target.value) || 1)}
                className="border border-slate-300 rounded-md px-3 py-2 w-24"
                min="1"
              />
            </div>

            {/* Individual Test Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={testGetAllModules}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get All Modules
              </button>

              <button
                onClick={testGetModuleById}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Module by ID
              </button>

              <button
                onClick={testCreateModule}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create Module
              </button>

              <button
                onClick={testUpdateModule}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Update Module
              </button>

              <button
                onClick={testDeleteModule}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Module
              </button>

              <button
                onClick={testCheckModuleNameExists}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Check Name Exists
              </button>
            </div>

            {/* Bulk Operations */}
            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold text-slate-700 mb-2">Bulk Operations</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={testDeleteMultipleModules}
                  disabled={loading || modules.length < 2}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Delete Multiple
                </button>

                <button
                  onClick={testErrorScenarios}
                  disabled={loading}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Test Errors
                </button>
              </div>
            </div>

            {/* Master Controls */}
            <div className="border-t pt-4 flex gap-3">
              <button
                onClick={runAllTests}
                disabled={loading}
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

            {/* Current Modules */}
            {modules.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-slate-700 mb-2">Current Modules ({modules.length})</h3>
                <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-md p-3">
                  {modules.map(module => (
                    <div key={module.id} className="text-sm text-slate-600 mb-1">
                      <strong>#{module.id}</strong> {module.name}
                    </div>
                  ))}
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
                      <p className="text-red-700 text-sm mb-2 font-medium">{result.error}</p>
                    )}

                    {result.data && (
                      <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;