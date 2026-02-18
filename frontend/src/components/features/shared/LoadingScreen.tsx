import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/utils';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({ message, fullScreen = false, className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'fixed inset-0 bg-white/80 z-50' : 'min-h-[50vh]',
        className
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
