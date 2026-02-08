import { cn } from '@/lib/utils/utils';

const APP_VERSION = '1.0.0';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-gray-200 bg-white px-6 py-3 text-center text-sm text-gray-500',
        className,
      )}
    >
      <p>
        &copy; {currentYear} Clinical Storage System (URCN-LIMS) &mdash; v{APP_VERSION}
      </p>
    </footer>
  );
}
