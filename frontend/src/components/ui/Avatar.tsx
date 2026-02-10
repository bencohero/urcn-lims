import { cn } from '@/lib/utils/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn(
          'inline-block rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  const displayName = name || alt || '?';
  const initials = getInitials(displayName);
  const colorClass = getColorFromName(displayName);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-label={displayName}
    >
      {initials}
    </span>
  );
}
