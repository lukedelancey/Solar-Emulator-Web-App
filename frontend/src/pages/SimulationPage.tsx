import React, { useState, useCallback } from 'react';
import { PVModule, SimulationResponse } from '../types';
import { simulateIVCurve } from '../services/moduleService';
import ModuleSelector from '../components/simulation/ModuleSelector';
import ModuleParametersCard from '../components/simulation/ModuleParametersCard';
import EnvironmentalForm from '../components/simulation/EnvironmentalForm';
import IVCurveChart from '../components/simulation/IVCurveChart';
import PVCurveChart from '../components/simulation/PVCurveChart';

interface EnvironmentalParameters {
  temperature: number;
  irradiance: number;
}

const SimulationPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<PVModule | null>(null);
  const [environmentalParams, setEnvironmentalParams] = useState<EnvironmentalParameters>({
    temperature: 25,
    irradiance: 1000
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const handleModuleSelect = useCallback((module: PVModule | null) => {
    setSelectedModule(module);
    setSimulationData(null); // Clear previous simulation
    setSimulationError(null);
  }, []);

  const handleEnvironmentalChange = useCallback((params: EnvironmentalParameters) => {
    setEnvironmentalParams(prevParams => {
      // Only update if values have changed
      if (prevParams.temperature !== params.temperature || prevParams.irradiance !== params.irradiance) {
        return params;
      }
      return prevParams;
    });
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!selectedModule) {
      setSimulationError('No module selected for simulation');
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);
    setSimulationData(null);

    try {
      console.log('Simulating with:', {
        module: selectedModule,
        parameters: environmentalParams
      });

      const response = await simulateIVCurve({
        module_id: selectedModule.id,
        temperature: environmentalParams.temperature,
        irradiance: environmentalParams.irradiance
      });

      console.log('Simulation response:', response);
      setSimulationData(response);
    } catch (error: any) {
      console.error('Simulation failed:', error);
      setSimulationError(error.message || 'Failed to generate simulation');
    } finally {
      setIsSimulating(false);
    }
  }, [selectedModule, environmentalParams]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">PV Model Simulation</h1>
        </div>
        <p className="text-slate-600">
          Select a PV module, configure environmental conditions, and generate I-V and P-V curves
          using physics-based single-diode modeling.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Controls and Module Parameters */}
        <div className="xl:col-span-1 space-y-6">
          <ModuleSelector
            selectedModule={selectedModule}
            onModuleSelect={handleModuleSelect}
          />

          <ModuleParametersCard module={selectedModule} />

          <EnvironmentalForm
            onParametersChange={handleEnvironmentalChange}
            onSimulate={handleSimulate}
            isSimulating={isSimulating}
          />
        </div>

        {/* Right Column - Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* I-V Curve Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">I-V Curve</h2>

            {simulationError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm font-medium">Simulation Error</span>
                </div>
                <p className="text-red-600 text-sm mt-2">{simulationError}</p>
              </div>
            ) : !selectedModule ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-slate-600">No I-V Curve Available</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      Select a PV module to generate current-voltage curves
                    </p>
                  </div>
                </div>
              </div>
            ) : simulationData ? (
              <IVCurveChart simulationData={simulationData} isLoading={isSimulating} />
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">I-V Curve Ready</h3>
                    <p className="text-sm text-blue-700 mt-2">
                      Current vs Voltage curve for "{selectedModule.name}"
                    </p>
                  </div>
                  {isSimulating && (
                    <div className="flex items-center space-x-2 text-blue-600 mt-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm font-medium">Generating I-V curve...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* P-V Curve Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">P-V Curve</h2>

            {simulationError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm font-medium">Simulation Error</span>
                </div>
                <p className="text-red-600 text-sm mt-2">{simulationError}</p>
              </div>
            ) : !selectedModule ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-slate-600">No P-V Curve Available</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      Select a PV module to generate power-voltage curves
                    </p>
                  </div>
                </div>
              </div>
            ) : simulationData ? (
              <PVCurveChart simulationData={simulationData} isLoading={isSimulating} />
            ) : (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-800">P-V Curve Ready</h3>
                    <p className="text-sm text-emerald-700 mt-2">
                      Power vs Voltage curve for "{selectedModule.name}"
                    </p>
                  </div>
                  {isSimulating && (
                    <div className="flex items-center space-x-2 text-emerald-600 mt-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <span className="text-sm font-medium">Generating P-V curve...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reserved Space for Future Features */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-700">Additional Information</h3>
            <p className="text-sm text-slate-600 mt-1">
              Reserved space for future enhancements and additional simulation data.
            </p>
          </div>
          <div className="text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;