import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsChart({ 
  data = [], 
  title, 
  labelKey = "label", 
  valueKey = "value", 
  unit = "" 
}) {
  if (!data || !data.length) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 text-center">
        <span className="text-2xl mb-2">📊</span>
        <p className="text-xs font-bold uppercase tracking-widest">{title || "Waiting for data..."}</p>
        <p className="text-[10px] mt-1 opacity-60">Telemetry stream initializing...</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    timeLabel: item[labelKey],
    volume: item[valueKey]
  }));

  return (
    <div className="h-72 w-full pt-4" style={{ minWidth: 200, minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
          <XAxis 
            dataKey="timeLabel" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ color: '#0f172a', fontWeight: 600 }}
            formatter={(value) => [`${value} interactions`, 'Activity']}
          />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#bfdbfe', strokeWidth: 4 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
