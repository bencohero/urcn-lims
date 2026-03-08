import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Bell,
  Wrench,
  AlertTriangle,
  Clock,
  Info,
  ArrowRightLeft,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { notificationsApi } from '@/lib/api/notifications';
import type { Notification, NotificationType, NotificationPriority } from '@/types';

// --- Icon map by type ---
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

// --- Priority badge variant map ---
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

// --- Relative time helper ---
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

// --- Route helper for related entities ---
function getEntityRoute(type: string, id: string): string {
  const routes: Record<string, string> = {
    document: `/documents/${id}`,
    equipment: `/equipment/${id}`,
    consumable: `/consumables/${id}`,
    access_request: `/access-requests/${id}`,
    movement: `/movements/${id}`,
    study: `/studies/${id}`,
    site: `/sites/${id}`,
  };
  return routes[type.toLowerCase()] ?? '/';
}

// --- Single notification row ---
interface NotificationRowProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationRow({ notification, onClose }: NotificationRowProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const markAsRead = useMarkAsRead();
  const [deleting, setDeleting] = useState(false);

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.related_entity_type && notification.related_entity_id) {
      navigate(
        getEntityRoute(notification.related_entity_type, notification.related_entity_id),
      );
      onClose();
    }
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
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        'group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-100',
        notification.is_read ? 'bg-gray-50' : 'bg-white',
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary-600" />
      )}

      {/* Type icon */}
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          TYPE_ICON_COLOR[notification.notification_type],
        )}
      >
        {TYPE_ICON[notification.notification_type]}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium text-gray-900 leading-snug', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          <Badge variant={PRIORITY_VARIANT[notification.priority]} className="shrink-0 text-xs">
            {PRIORITY_LABELS[notification.priority]}
          </Badge>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-gray-400">{relativeTime(notification.sent_at)}</p>
      </div>

      {/* Delete button — visible on row hover */}
      <button
        type="button"
        aria-label="Supprimer la notification"
        disabled={deleting}
        onClick={handleDelete}
        className={cn(
          'absolute right-3 top-3 hidden rounded p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 group-hover:flex',
          deleting && 'opacity-50',
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// --- Panel ---
export function NotificationsPanel() {
  const navigate = useNavigate();
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const markAllAsRead = useMarkAllAsRead();

  const { data } = useNotifications(
    showUnreadOnly ? { is_read: false } : undefined,
  );

  const notifications = data?.items ?? [];
  const unreadCount = data?.items.filter((n) => !n.is_read).length ?? 0;

  const handleClose = () => setNotificationsOpen(false);

  if (!notificationsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={handleClose}
      />

      {/* Slide-over panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="info" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Tout marquer comme lu"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer lu
            </button>
            <button
              type="button"
              aria-label="Fermer le panneau de notifications"
              onClick={handleClose}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setShowUnreadOnly(false)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              !showUnreadOnly
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => setShowUnreadOnly(true)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              showUnreadOnly
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Non lues
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Aucune notification</p>
              <p className="mt-1 text-xs text-gray-400">
                {showUnreadOnly
                  ? 'Toutes les notifications ont été lues'
                  : 'Vous êtes à jour'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClose={handleClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-sm text-primary-600 hover:text-primary-700"
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </aside>
    </>
  );
}
