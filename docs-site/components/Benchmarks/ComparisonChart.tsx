'use client';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface ComparisonChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  type?: 'bar' | 'horizontal-bar';
}

export default function ComparisonChart({
  title,
  data,
  unit = 'ms',
  type = 'bar',
}: ComparisonChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  const defaultColors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
  ];

  if (type === 'horizontal-bar') {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {item.value.toFixed(0)} {unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`${item.color || defaultColors[index % defaultColors.length]} h-3 rounded-full transition-all`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
      <div className="flex items-end justify-around gap-4 h-64">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full">
            <div className="flex-1 flex flex-col justify-end w-full">
              <div className="text-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value.toFixed(0)}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{unit}</span>
              </div>
              <div
                className={`${item.color || defaultColors[index % defaultColors.length]} rounded-t-lg w-full transition-all`}
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

