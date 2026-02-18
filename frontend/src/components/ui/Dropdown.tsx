import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: (DropdownItem | 'separator')[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Dropdown({ trigger, items, align = 'end', side = 'bottom' }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          {items.map((item, index) => {
            if (item === 'separator') {
              return (
                <DropdownMenu.Separator
                  key={`sep-${index}`}
                  className="my-1 h-px bg-gray-100"
                />
              );
            }

            return (
              <DropdownMenu.Item
                key={item.label}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors',
                  'focus:bg-gray-100',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  item.variant === 'danger'
                    ? 'text-red-600 focus:bg-red-50'
                    : 'text-gray-700'
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
