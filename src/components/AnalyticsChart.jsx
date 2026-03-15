/**
 * Simple analytics chart component.
 * Renders bar-chart-style visualizations for dashboard widgets.
 */
export default function AnalyticsChart({ title, data, labelKey, valueKey, unit }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-400 text-sm">No data available yet.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d[valueKey]));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-24 flex-shrink-0 truncate">
              {item[labelKey]}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: maxValue > 0 ? `${(item[valueKey] / maxValue) * 100}%` : "0%",
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 w-16 text-right">
              {item[valueKey]} {unit || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
