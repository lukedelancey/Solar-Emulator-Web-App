import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { SimulationResponse } from '../../types';

interface IVCurveChartProps {
  simulationData: SimulationResponse;
  isLoading?: boolean;
}

interface ChartDataPoint {
  voltage: number;
  current: number;
}

const IVCurveChart: React.FC<IVCurveChartProps> = ({ simulationData, isLoading = false }) => {
  // Transform the iv_curve data for Recharts
  const chartData: ChartDataPoint[] = simulationData.iv_curve.map(([voltage, current]) => ({
    voltage: Number(voltage.toFixed(3)),
    current: Number(current.toFixed(3))
  }));

  // Key points for reference dots
  const voc = { voltage: simulationData.summary.Voc, current: 0 };
  const isc = { voltage: 0, current: simulationData.summary.Isc };
  const mpp = { voltage: simulationData.summary.Vmp, current: simulationData.summary.Imp };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const voltage = Number(label).toFixed(2);
      const current = Number(payload[0].value).toFixed(3);
      const power = (Number(label) * Number(payload[0].value)).toFixed(2);

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Operating Point</p>
          <p className="text-blue-600">Voltage: {voltage} V</p>
          <p className="text-green-600">Current: {current} A</p>
          <p className="text-purple-600">Power: {power} W</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-slate-50 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm">Generating I-V curve...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Info Header */}
      <div className="mb-4 bg-slate-50 rounded-lg p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Temperature:</span>
            <span className="ml-2 font-medium text-slate-800">{simulationData.temperature}°C</span>
          </div>
          <div>
            <span className="text-slate-600">Irradiance:</span>
            <span className="ml-2 font-medium text-slate-800">{simulationData.irradiance} W/m²</span>
          </div>
          <div>
            <span className="text-slate-600">Data Points:</span>
            <span className="ml-2 font-medium text-slate-800">{chartData.length}</span>
          </div>
          <div>
            <span className="text-slate-600">Max Power:</span>
            <span className="ml-2 font-medium text-slate-800">{simulationData.summary.Pmp.toFixed(1)} W</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="voltage"
              type="number"
              scale="linear"
              domain={[0, 'dataMax']}
              label={{ value: 'Voltage (V)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(1)}
            />

            <YAxis
              dataKey="current"
              domain={[0, 'dataMax']}
              label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Main I-V curve */}
            <Line
              type="monotone"
              dataKey="current"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#2563eb' }}
            />

            {/* Reference dots for key points */}
            {/* Voc point */}
            <ReferenceDot
              x={voc.voltage}
              y={voc.current}
              r={5}
              fill="#dc2626"
              stroke="#fff"
              strokeWidth={2}
            />

            {/* Isc point */}
            <ReferenceDot
              x={isc.voltage}
              y={isc.current}
              r={5}
              fill="#059669"
              stroke="#fff"
              strokeWidth={2}
            />

            {/* Maximum power point */}
            <ReferenceDot
              x={mpp.voltage}
              y={mpp.current}
              r={6}
              fill="#7c3aed"
              stroke="#fff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-blue-600"></div>
          <span className="text-slate-600">I-V Curve</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-slate-600">Voc ({voc.voltage.toFixed(2)} V)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-slate-600">Isc ({isc.current.toFixed(2)} A)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
          <span className="text-slate-600">MPP ({mpp.voltage.toFixed(2)} V, {mpp.current.toFixed(2)} A)</span>
        </div>
      </div>
    </div>
  );
};

export default IVCurveChart;