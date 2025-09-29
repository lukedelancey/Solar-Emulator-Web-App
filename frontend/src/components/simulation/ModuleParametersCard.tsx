import React from 'react';
import { PVModule } from '../../types';

interface ModuleParametersCardProps {
  module: PVModule | null;
  className?: string;
}


const PlaceholderCard: React.FC = () => (
  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
    <div className="flex flex-col items-center space-y-3">
      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div>
        <h3 className="text-lg font-medium text-slate-600">No Module Selected</h3>
        <p className="text-sm text-slate-500 mt-1">
          Select a PV module from the dropdown above to view its parameters
        </p>
      </div>
    </div>
  </div>
);

const ModuleParametersCard: React.FC<ModuleParametersCardProps> = ({
  module,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Selected Model Parameters</h2>

      {!module ? (
        <PlaceholderCard />
      ) : (
        <div className="space-y-4">
          {/* Module Header */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-100">
            <h3 className="text-xl font-bold text-slate-800">{module.name}</h3>
            <p className="text-sm text-slate-600 mt-1">
              Cell Technology: <span className="font-medium text-teal-700">{module.celltype}</span>
            </p>
          </div>

          {/* Compact Parameters Grid */}
          <div className="space-y-3">
            {/* Electrical Characteristics */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                <svg className="w-4 h-4 text-teal-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Electrical
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Voc:</span>
                  <span className="font-medium">{module.voc}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Isc:</span>
                  <span className="font-medium">{module.isc}A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Vmp:</span>
                  <span className="font-medium">{module.vmp}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Imp:</span>
                  <span className="font-medium">{module.imp}A</span>
                </div>
              </div>
            </div>

            {/* Physical & Thermal */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                <svg className="w-4 h-4 text-cyan-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Physical & Thermal
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cells:</span>
                  <span className="font-medium">{module.ns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kv:</span>
                  <span className="font-medium">{module.kv}%/°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ki:</span>
                  <span className="font-medium">{module.ki}%/°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">γ_Pmp:</span>
                  <span className="font-medium">{module.gamma_pmp}%/°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maximum Power Calculation */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-semibold text-slate-700">Maximum Power (STC)</h4>
                <p className="text-xs text-slate-600 mt-1">Standard Test Conditions (25°C, 1000 W/m²)</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-700">
                  {(module.vmp * module.imp).toFixed(1)}
                </span>
                <span className="text-lg text-emerald-600 ml-1">W</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleParametersCard;