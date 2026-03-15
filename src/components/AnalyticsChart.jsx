import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsChart({ events }) {
  if (!events || !events.length) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        Waiting for telemetry data to visualize...
      </div>
    );
  }

  // Transform events into chart-friendly data (bucketing by hour)
  const dataMap = {};
  events.forEach(e => {
    // We group by hour of day for simple visualization
    const date = new Date(e.timestamp);
    const label = `${date.getHours()}:00`;
    
    // Using a map keyed by the label string allows days to aggregate into typical hours of activity
    dataMap[label] = dataMap[label] ? dataMap[label] + 1 : 1;
  });

  // Sort chronologically by hour (0 to 23)
  const chartData = Object.keys(dataMap)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(timeLabel => ({ timeLabel, volume: dataMap[timeLabel] }));

  return (
    <div className="h-72 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
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
