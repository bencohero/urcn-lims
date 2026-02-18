import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/utils';

interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'data-[state=active]:border-primary-600 data-[state=active]:text-primary-600',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  value === tab.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export const TabContent = TabsPrimitive.Content;
