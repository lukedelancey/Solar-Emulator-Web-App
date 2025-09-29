import React, { useState, useEffect } from 'react';
import { PVModule } from '../../types';
import { getAllModules } from '../../services/moduleService';

interface ModuleSelectorProps {
  selectedModule: PVModule | null;
  onModuleSelect: (module: PVModule | null) => void;
  className?: string;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  selectedModule,
  onModuleSelect,
  className = ''
}) => {
  const [modules, setModules] = useState<PVModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedModules = await getAllModules();
        setModules(fetchedModules);
      } catch (err: any) {
        setError(err.message || 'Failed to load PV modules');
        console.error('Error fetching modules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleModuleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const moduleId = event.target.value;
    if (moduleId === '') {
      onModuleSelect(null);
    } else {
      const module = modules.find(m => m.id === parseInt(moduleId));
      onModuleSelect(module || null);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Select PV Module</h2>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
          <span className="text-slate-600">Loading modules...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Select PV Module</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm font-medium">Error loading modules</span>
          </div>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
          >
            Refresh page to try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Select PV Module</h2>

      {modules.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-700 text-sm font-medium">No modules available</span>
          </div>
          <p className="text-amber-600 text-sm mt-2">
            No PV modules found in the database. Please add some modules first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="module-select" className="block text-sm font-medium text-slate-700">
            Choose a PV module from your database:
          </label>

          <select
            id="module-select"
            value={selectedModule?.id || ''}
            onChange={handleModuleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 bg-white text-slate-800"
          >
            <option value="">-- Select a PV module --</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name} ({module.celltype}, {module.voc}V, {module.isc}A)
              </option>
            ))}
          </select>

          <div className="text-xs text-slate-500 mt-2">
            {modules.length} module{modules.length !== 1 ? 's' : ''} available in database
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleSelector;