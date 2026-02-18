import { Check, Clock, X, Package, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { formatDateTime } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface WorkflowStep {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'RETURNED';
  label: string;
  timestamp?: string;
  user?: string;
  note?: string;
}

const STEP_CONFIG: Record<string, { icon: ReactNode; activeColor: string; completedColor: string }> = {
  PENDING: { icon: <Clock className="h-4 w-4" />, activeColor: 'bg-yellow-100 text-yellow-600 border-yellow-300', completedColor: 'bg-yellow-500 text-white border-yellow-500' },
  APPROVED: { icon: <Check className="h-4 w-4" />, activeColor: 'bg-green-100 text-green-600 border-green-300', completedColor: 'bg-green-500 text-white border-green-500' },
  REJECTED: { icon: <X className="h-4 w-4" />, activeColor: 'bg-red-100 text-red-600 border-red-300', completedColor: 'bg-red-500 text-white border-red-500' },
  FULFILLED: { icon: <Package className="h-4 w-4" />, activeColor: 'bg-blue-100 text-blue-600 border-blue-300', completedColor: 'bg-blue-500 text-white border-blue-500' },
  RETURNED: { icon: <RotateCcw className="h-4 w-4" />, activeColor: 'bg-purple-100 text-purple-600 border-purple-300', completedColor: 'bg-purple-500 text-white border-purple-500' },
};

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  currentStatus: string;
}

export function WorkflowTimeline({ steps, currentStatus }: WorkflowTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const config = STEP_CONFIG[step.status] || STEP_CONFIG.PENDING;
        const isCompleted = !!step.timestamp;
        const isCurrent = step.status === currentStatus && !step.timestamp;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="relative flex gap-4">
            {/* Connector line */}
            {!isLast && (
              <div className={cn(
                'absolute left-4 top-8 bottom-0 w-px',
                isCompleted ? 'bg-gray-300' : 'bg-gray-200'
              )} />
            )}

            {/* Icon */}
            <div className={cn(
              'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
              isCompleted ? config.completedColor : isCurrent ? config.activeColor : 'bg-gray-50 text-gray-400 border-gray-200'
            )}>
              {config.icon}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <p className={cn(
                'text-sm font-medium',
                isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
              )}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(step.timestamp)}</p>
              )}
              {step.user && (
                <p className="text-xs text-gray-500">Par {step.user}</p>
              )}
              {step.note && (
                <p className="mt-1 text-xs text-gray-600 italic">&laquo; {step.note} &raquo;</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
