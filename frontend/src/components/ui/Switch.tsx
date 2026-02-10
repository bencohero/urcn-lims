import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils/utils';
import { Label } from './Label';

interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-center justify-between gap-3">
        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <Label htmlFor={switchId} className="cursor-pointer">
                {label}
              </Label>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        )}
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          className={cn(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-gray-200',
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
              'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
