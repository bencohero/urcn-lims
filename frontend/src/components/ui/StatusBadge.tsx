import { Badge } from './Badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from './Badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  // General
  ACTIVE: { label: 'Actif', variant: 'success' },
  INACTIVE: { label: 'Inactif', variant: 'default' },
  CLOSED: { label: 'Ferme', variant: 'default' },

  // Document / Equipment
  IN_STORAGE: { label: 'En stock', variant: 'success' },
  CHECKED_OUT: { label: 'Sorti', variant: 'orange' },
  IN_TRANSIT: { label: 'En transit', variant: 'info' },
  ARCHIVED: { label: 'Archive', variant: 'default' },
  DESTROYED: { label: 'Detruit', variant: 'danger' },

  // Equipment Operational
  OPERATIONAL: { label: 'Operationnel', variant: 'success' },
  MAINTENANCE: { label: 'Maintenance', variant: 'warning' },
  OUT_OF_SERVICE: { label: 'Hors service', variant: 'danger' },
  DECOMMISSIONED: { label: 'Decommissionne', variant: 'default' },

  // Consumable
  IN_USE: { label: 'En cours', variant: 'info' },
  EXPIRED: { label: 'Expire', variant: 'danger' },
  DISPOSED: { label: 'Elimine', variant: 'default' },

  // Access Request
  PENDING: { label: 'En attente', variant: 'warning' },
  APPROVED: { label: 'Approuve', variant: 'info' },
  REJECTED: { label: 'Rejete', variant: 'danger' },
  FULFILLED: { label: 'Remis', variant: 'purple' },
  RETURNED: { label: 'Retourne', variant: 'default' },
  OVERDUE: { label: 'En retard', variant: 'danger' },

  // Study
  PAUSED: { label: 'En pause', variant: 'warning' },
  COMPLETED: { label: 'Termine', variant: 'default' },
  TERMINATED: { label: 'Arrete', variant: 'danger' },

  // RFID Tag
  DAMAGED: { label: 'Endommage', variant: 'danger' },
  LOST: { label: 'Perdu', variant: 'danger' },

  // Urgency
  LOW: { label: 'Basse', variant: 'default' },
  MEDIUM: { label: 'Moyenne', variant: 'info' },
  HIGH: { label: 'Haute', variant: 'orange' },
  CRITICAL: { label: 'Critique', variant: 'danger' },

  // Confidentiality
  // LOW already defined above
  // MEDIUM already defined above
  // HIGH already defined above
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const mapping = STATUS_MAP[status] || { label: status, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={mapping.variant} className={className}>
      {mapping.label}
    </Badge>
  );
}
