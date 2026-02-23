"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  className = "",
}: ProgressBarProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  );
}
