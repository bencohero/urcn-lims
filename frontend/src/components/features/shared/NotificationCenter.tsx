import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn, formatDateTime } from '@/lib/utils/utils';
import type { Notification } from '@/types';

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  URGENT: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
  HIGH: { color: 'bg-orange-100 text-orange-700', label: 'Important' },
  NORMAL: { color: 'bg-blue-100 text-blue-700', label: 'Normal' },
  LOW: { color: 'bg-gray-100 text-gray-700', label: 'Info' },
};

const ENTITY_ROUTES: Record<string, string> = {
  document: '/documents',
  equipment: '/equipment',
  consumable: '/consumables',
  access_request: '/access-requests',
};

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
  const navigate = useNavigate();
  const priority = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.NORMAL;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }
    if (notification.related_entity_type && notification.related_entity_id) {
      const basePath = ENTITY_ROUTES[notification.related_entity_type];
      if (basePath) {
        navigate(`${basePath}/${notification.related_entity_id}`);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
        !notification.is_read && 'bg-primary-50/50'
      )}
    >
      <span className={cn('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', priority?.color)}>
        {priority?.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm text-gray-900', !notification.is_read && 'font-medium')}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notification.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{formatDateTime(notification.sent_at)}</p>
      </div>
      {!notification.is_read && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
      )}
    </button>
  );
}

export function NotificationCenter() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <Dropdown
      trigger={
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      }
      items={[]}
      align="end"
    />
  );
}

export function NotificationPanel() {
  const { data: notificationsData } = useNotifications({ page: 1, page_size: 20 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.items ?? [];
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="w-96 max-h-[70vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="primary">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={() => markAllAsRead.mutate()}
          >
            Tout marquer lu
          </Button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Aucune notification
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markAsRead.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
