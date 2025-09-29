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

interface PVCurveChartProps {
  simulationData: SimulationResponse;
  isLoading?: boolean;
}

interface ChartDataPoint {
  voltage: number;
  power: number;
}

const PVCurveChart: React.FC<PVCurveChartProps> = ({ simulationData, isLoading = false }) => {
  // Transform the pv_curve data for Recharts
  const chartData: ChartDataPoint[] = simulationData.pv_curve.map(([voltage, power]) => ({
    voltage: Number(voltage.toFixed(3)),
    power: Number(power.toFixed(3))
  }));

  // Maximum power point
  const mpp = {
    voltage: simulationData.summary.Vmp,
    power: simulationData.summary.Pmp
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const voltage = Number(label).toFixed(2);
      const power = Number(payload[0].value).toFixed(2);
      const powerValue = Number(payload[0].value);
      const current = powerValue > 0 ? (powerValue / Number(label)).toFixed(3) : '0.000';

      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Operating Point</p>
          <p className="text-blue-600">Voltage: {voltage} V</p>
          <p className="text-emerald-600">Power: {power} W</p>
          <p className="text-purple-600">Current: {current} A</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-96 bg-slate-50 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
          <span className="text-sm">Generating P-V curve...</span>
        </div>
      </div>
    );
  }

  // Calculate some additional statistics
  const maxPower = Math.max(...chartData.map(d => d.power));
  const fillFactor = (mpp.power / (simulationData.summary.Voc * simulationData.summary.Isc)) * 100;

  return (
    <div className="w-full">
      {/* Chart Info Header */}
      <div className="mb-4 bg-emerald-50 rounded-lg p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-emerald-700">Max Power:</span>
            <span className="ml-2 font-medium text-emerald-900">{maxPower.toFixed(1)} W</span>
          </div>
          <div>
            <span className="text-emerald-700">MPP Voltage:</span>
            <span className="ml-2 font-medium text-emerald-900">{mpp.voltage.toFixed(2)} V</span>
          </div>
          <div>
            <span className="text-emerald-700">MPP Current:</span>
            <span className="ml-2 font-medium text-emerald-900">{simulationData.summary.Imp.toFixed(2)} A</span>
          </div>
          <div>
            <span className="text-emerald-700">Fill Factor:</span>
            <span className="ml-2 font-medium text-emerald-900">{fillFactor.toFixed(1)}%</span>
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
              dataKey="power"
              domain={[0, 'dataMax']}
              label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(0)}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Main P-V curve */}
            <Line
              type="monotone"
              dataKey="power"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#059669' }}
            />

            {/* Maximum power point */}
            <ReferenceDot
              x={mpp.voltage}
              y={mpp.power}
              r={6}
              fill="#7c3aed"
              stroke="#fff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Key Information */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-4 justify-center text-sm mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-emerald-600"></div>
            <span className="text-slate-600">P-V Curve</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="text-slate-600">Maximum Power Point</span>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
          <h4 className="font-medium text-emerald-900 mb-2">Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700">{mpp.power.toFixed(1)} W</div>
              <div className="text-emerald-600">Maximum Power</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700">{fillFactor.toFixed(1)}%</div>
              <div className="text-emerald-600">Fill Factor</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700">{(mpp.power / (simulationData.irradiance / 1000)).toFixed(1)} W/m²</div>
              <div className="text-emerald-600">Power Density</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PVCurveChart;