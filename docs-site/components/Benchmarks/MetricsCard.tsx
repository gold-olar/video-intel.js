'use client';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'orange';
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'indigo',
}: MetricsCardProps) {
  const colorClasses = {
    indigo: {
      bg: 'from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
      iconText: 'text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    green: {
      bg: 'from-green-50 to-white dark:from-green-950/20 dark:to-gray-900',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconText: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconText: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      iconText: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      iconText: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-600 dark:text-orange-400',
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br ${classes.bg} p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${classes.text}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.value > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg ${classes.iconBg} p-3`}>
          <div className={`h-6 w-6 ${classes.iconText}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

