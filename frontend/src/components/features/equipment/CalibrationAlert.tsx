import { AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { formatDate } from '@/lib/utils/utils';

interface CalibrationAlertProps {
  nextCalibrationDate: string;
  className?: string;
}

export function CalibrationAlert({ nextCalibrationDate, className }: CalibrationAlertProps) {
  const nextDate = new Date(nextCalibrationDate);
  const now = new Date();
  const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 30) return null;

  const isOverdue = diffDays < 0;
  const isUrgent = diffDays <= 7;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-3 text-sm',
        isOverdue
          ? 'border-red-200 bg-red-50 text-red-800'
          : isUrgent
            ? 'border-orange-200 bg-orange-50 text-orange-800'
            : 'border-yellow-200 bg-yellow-50 text-yellow-800',
        className
      )}
      role="alert"
    >
      {isOverdue ? (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      ) : (
        <Calendar className="h-4 w-4 shrink-0" />
      )}
      <span>
        {isOverdue
          ? `Calibration en retard de ${Math.abs(diffDays)} jour(s)`
          : `Calibration prevue le ${formatDate(nextCalibrationDate)} (dans ${diffDays} jour(s))`}
      </span>
    </div>
  );
}
