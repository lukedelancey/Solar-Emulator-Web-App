import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface EnvironmentalParameters {
  temperature: number;
  irradiance: number;
}

interface EnvironmentalFormProps {
  onParametersChange: (params: EnvironmentalParameters) => void;
  onSimulate: () => void;
  isSimulating?: boolean;
  className?: string;
}

const validationSchema = yup.object({
  temperature: yup
    .number()
    .required('Temperature is required')
    .min(-40, 'Temperature must be at least -40°C')
    .max(85, 'Temperature must be at most 85°C')
    .typeError('Temperature must be a number'),
  irradiance: yup
    .number()
    .required('Irradiance is required')
    .min(0, 'Irradiance must be at least 0 W/m²')
    .max(1500, 'Irradiance must be at most 1500 W/m²')
    .typeError('Irradiance must be a number'),
});

const EnvironmentalForm: React.FC<EnvironmentalFormProps> = ({
  onParametersChange,
  onSimulate,
  isSimulating = false,
  className = ''
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue
  } = useForm<EnvironmentalParameters>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      temperature: 25,
      irradiance: 1000
    },
    mode: 'onChange'
  });

  const watchedValues = watch();
  const previousValuesRef = React.useRef<EnvironmentalParameters | undefined>(undefined);

  React.useEffect(() => {
    if (isValid) {
      const currentValues = watchedValues;
      const previousValues = previousValuesRef.current;

      // Only call onParametersChange if values have actually changed
      if (!previousValues ||
          currentValues.temperature !== previousValues.temperature ||
          currentValues.irradiance !== previousValues.irradiance) {
        onParametersChange(currentValues);
        previousValuesRef.current = currentValues;
      }
    }
  }, [watchedValues, isValid, onParametersChange]);

  const onSubmit = (data: EnvironmentalParameters) => {
    onParametersChange(data);
    onSimulate();
  };

  const setStandardConditions = () => {
    setValue('temperature', 25);
    setValue('irradiance', 1000);
  };

  const setHotConditions = () => {
    setValue('temperature', 50);
    setValue('irradiance', 1200);
  };

  const setLowLightConditions = () => {
    setValue('temperature', 25);
    setValue('irradiance', 200);
  };

  const setColdConditions = () => {
    setValue('temperature', 0);
    setValue('irradiance', 1000);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Environmental Conditions</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Temperature Input */}
        <div className="space-y-1">
          <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">
            Temperature (°C)
          </label>
          <input
            {...register('temperature')}
            type="number"
            step="0.1"
            min="-40"
            max="85"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 ${
              errors.temperature
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300 bg-white'
            }`}
            placeholder="25.0"
          />
          {errors.temperature && (
            <p className="text-red-600 text-xs">{errors.temperature.message}</p>
          )}
          <p className="text-xs text-slate-500">Valid range: -40°C to 85°C</p>
        </div>

        {/* Irradiance Input */}
        <div className="space-y-1">
          <label htmlFor="irradiance" className="block text-sm font-medium text-slate-700">
            Irradiance (W/m²)
          </label>
          <input
            {...register('irradiance')}
            type="number"
            step="1"
            min="0"
            max="1500"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200 ${
              errors.irradiance
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300 bg-white'
            }`}
            placeholder="1000"
          />
          {errors.irradiance && (
            <p className="text-red-600 text-xs">{errors.irradiance.message}</p>
          )}
          <p className="text-xs text-slate-500">Valid range: 0 to 1500 W/m²</p>
        </div>

        {/* Quick Preset Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">Quick Presets:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={setStandardConditions}
              className="px-2 py-1.5 bg-teal-100 text-teal-700 rounded-md text-xs font-medium hover:bg-teal-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              STC (25°C, 1000 W/m²)
            </button>
            <button
              type="button"
              onClick={setHotConditions}
              className="px-2 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Hot (50°C, 1200 W/m²)
            </button>
            <button
              type="button"
              onClick={setLowLightConditions}
              className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-md text-xs font-medium hover:bg-amber-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Low Light (25°C, 200 W/m²)
            </button>
            <button
              type="button"
              onClick={setColdConditions}
              className="px-2 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cold (0°C, 1000 W/m²)
            </button>
          </div>
        </div>

        {/* Plot Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid || isSimulating}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !isValid || isSimulating
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 focus:ring-teal-500 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isSimulating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Curves...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Plot Graphs
              </div>
            )}
          </button>

          {!isValid && (
            <p className="text-amber-600 text-xs mt-1.5 text-center">
              Please correct the input values to enable simulation
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EnvironmentalForm;