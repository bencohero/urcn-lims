import { cn } from '@/lib/utils/utils';

interface CapacityBarProps {
  label: string;
  percent: number;
}

export function CapacityBar({ label, percent }: CapacityBarProps) {
  const color =
    percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
        <div
          className={cn('h-2 rounded-full transition-all', color)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface SiteCapacityProps {
  sites: Array<{
    name: string;
    percent: number;
  }>;
}

export function SiteCapacityList({ sites }: SiteCapacityProps) {
  return (
    <div className="space-y-3">
      {sites.map((site) => (
        <CapacityBar key={site.name} label={site.name} percent={site.percent} />
      ))}
    </div>
  );
}
