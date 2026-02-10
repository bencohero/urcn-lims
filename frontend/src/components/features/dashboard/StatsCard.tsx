import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  change?: number;
  href?: string;
}

export function StatsCard({ title, value, icon, iconBg, change, href }: StatsCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={cn(href && 'cursor-pointer hover:shadow-md transition-shadow')}>
      <CardContent className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('fr-FR')}</p>
            {change !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  change >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        {href && (
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={() => navigate(href)}
            aria-label={`Voir ${title}`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
