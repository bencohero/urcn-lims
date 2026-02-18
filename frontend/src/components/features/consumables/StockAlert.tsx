import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { formatDate } from '@/lib/utils/utils';

interface StockAlertProps {
  expiryDate: string;
  quantity: number;
  minThreshold?: number;
  className?: string;
}

export function StockAlert({ expiryDate, quantity, minThreshold = 10, className }: StockAlertProps) {
  const expiresIn = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = expiresIn < 0;
  const isExpiringSoon = expiresIn >= 0 && expiresIn <= 30;
  const isLowStock = quantity <= minThreshold;

  if (!isExpired && !isExpiringSoon && !isLowStock) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {(isExpired || isExpiringSoon) && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-2.5 text-sm',
            isExpired
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-orange-200 bg-orange-50 text-orange-800'
          )}
          role="alert"
        >
          <Clock className="h-4 w-4 shrink-0" />
          {isExpired
            ? `Expire depuis le ${formatDate(expiryDate)}`
            : `Expire le ${formatDate(expiryDate)} (${expiresIn}j)`}
        </div>
      )}
      {isLowStock && (
        <div
          className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 text-sm text-yellow-800"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Stock bas: {quantity} unite(s) restante(s)
        </div>
      )}
    </div>
  );
}
