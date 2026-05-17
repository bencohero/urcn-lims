import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Wrench,
  AlertTriangle,
  Clock,
  Info,
  ArrowRightLeft,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { notificationsApi } from '@/lib/api/notifications';
import { formatDateTime } from '@/lib/utils/utils';
import type {
  Notification,
  NotificationFilters,
  NotificationType,
  NotificationPriority,
} from '@/types';

// --- Label / style maps ---

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  ACCESS_REQUEST: <Bell className="h-4 w-4" />,
  CALIBRATION: <Wrench className="h-4 w-4" />,
  EXPIRY: <AlertTriangle className="h-4 w-4" />,
  OVERDUE: <Clock className="h-4 w-4" />,
  SYSTEM: <Info className="h-4 w-4" />,
  MOVEMENT: <ArrowRightLeft className="h-4 w-4" />,
};

const TYPE_ICON_COLOR: Record<NotificationType, string> = {
  ACCESS_REQUEST: 'text-blue-600 bg-blue-100',
  CALIBRATION: 'text-yellow-600 bg-yellow-100',
  EXPIRY: 'text-orange-600 bg-orange-100',
  OVERDUE: 'text-red-600 bg-red-100',
  SYSTEM: 'text-gray-600 bg-gray-100',
  MOVEMENT: 'text-purple-600 bg-purple-100',
};

const TYPE_LABELS: Record<NotificationType, string> = {
  ACCESS_REQUEST: 'Demande d\'accès',
  CALIBRATION: 'Calibration',
  EXPIRY: 'Expiration',
  OVERDUE: 'En retard',
  SYSTEM: 'Système',
  MOVEMENT: 'Mouvement',
};

const PRIORITY_VARIANT: Record<
  NotificationPriority,
  'danger' | 'orange' | 'warning' | 'default'
> = {
  CRITICAL: 'danger',
  HIGH: 'orange',
  MEDIUM: 'warning',
  LOW: 'default',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Faible',
};

// --- Select options ---

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'ACCESS_REQUEST', label: 'Demande d\'accès' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'EXPIRY', label: 'Expiration' },
  { value: 'OVERDUE', label: 'En retard' },
  { value: 'SYSTEM', label: 'Système' },
  { value: 'MOVEMENT', label: 'Mouvement' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'LOW', label: 'Faible' },
];

const READ_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'true', label: 'Lues' },
  { value: 'false', label: 'Non lues' },
];

// --- Actions cell component ---
// Defined separately so hooks can be called at component level (not inside render callbacks)
interface ActionsCellProps {
  notification: Notification;
}

function ActionsCell({ notification }: ActionsCellProps) {
  const queryClient = useQueryClient();
  const markAsRead = useMarkAsRead();
  const [deleting, setDeleting] = useState(false);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead.mutate(notification.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await notificationsApi.delete(notification.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {!notification.is_read && (
        <button
          type="button"
          title="Marquer comme lu"
          onClick={handleMarkAsRead}
          disabled={markAsRead.isPending}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Marquer lu</span>
        </button>
      )}
      <button
        type="button"
        title="Supprimer"
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Supprimer</span>
      </button>
    </div>
  );
}

// --- Column definitions ---
// Columns defined at module level; ActionsCell is a proper component
const columns: Column<Notification>[] = [
  {
    key: 'notification_type',
    header: 'Type',
    sortable: true,
    render: (n) => (
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_COLOR[n.notification_type]}`}
        >
          {TYPE_ICON[n.notification_type]}
        </span>
        <span className="text-sm text-gray-700">{TYPE_LABELS[n.notification_type]}</span>
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Titre / Message',
    render: (n) => (
      <div className="max-w-xs">
        <p className="font-medium text-gray-900 leading-snug">{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
      </div>
    ),
  },
  {
    key: 'priority',
    header: 'Priorité',
    sortable: true,
    render: (n) => (
      <Badge variant={PRIORITY_VARIANT[n.priority]}>
        {PRIORITY_LABELS[n.priority]}
      </Badge>
    ),
  },
  {
    key: 'is_read',
    header: 'Statut',
    sortable: true,
    render: (n) =>
      n.is_read ? (
        <Badge variant="default">Lu</Badge>
      ) : (
        <Badge variant="info">Non lu</Badge>
      ),
  },
  {
    key: 'sent_at',
    header: "Date d'envoi",
    sortable: true,
    render: (n) => (
      <span className="whitespace-nowrap text-sm text-gray-600">
        {formatDateTime(n.sent_at)}
      </span>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (n) => <ActionsCell notification={n} />,
  },
];

// --- Page ---
export default function NotificationsPage() {
  const markAllAsRead = useMarkAllAsRead();

  const [filters, setFilters] = useState<
    NotificationFilters & { priority?: NotificationPriority; to_date?: string }
  >({
    page: 1,
    page_size: 25,
  });

  // Separate priority from NotificationFilters since API doesn't include it;
  // we keep it in local state for future extensibility but pass only API-compatible fields
  const { priority: _priority, to_date: _toDate, ...apiFilters } = filters;

  const { data, isLoading } = useNotifications(apiFilters);

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Historique et gestion de toutes vos notifications"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircle className="h-4 w-4" />}
            onClick={() => markAllAsRead.mutate()}
            loading={markAllAsRead.isPending}
          >
            Tout marquer lu
          </Button>
        }
      />

      {/* Filter bar */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              options={TYPE_OPTIONS}
              value={filters.notification_type ?? ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  notification_type: (val || undefined) as NotificationType | undefined,
                  page: 1,
                }))
              }
              placeholder="Type de notification"
            />
            <Select
              options={PRIORITY_OPTIONS}
              value={filters.priority ?? ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  priority: (val || undefined) as NotificationPriority | undefined,
                  page: 1,
                }))
              }
              placeholder="Priorité"
            />
            <Select
              options={READ_OPTIONS}
              value={
                filters.is_read === undefined
                  ? ''
                  : filters.is_read === true
                    ? 'true'
                    : 'false'
              }
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  is_read:
                    val === '' ? undefined : val === 'true' ? true : false,
                  page: 1,
                }))
              }
              placeholder="Statut de lecture"
            />
            <Input
              type="date"
              placeholder="À partir du"
              value={filters.from_date ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  from_date: e.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </div>
        </div>
      </Card>

      {/* Data table */}
      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          pagination={data?.pagination}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          sortBy={filters.sort_by}
          sortOrder={filters.sort_order}
          onSort={handleSort}
          rowKey={(n) => n.id}
          emptyTitle="Aucune notification"
          emptyDescription="Aucune notification ne correspond aux filtres sélectionnés"
        />
      </Card>
    </div>
  );
}
