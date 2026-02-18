import { FileText, ClipboardList, Tag, Settings, LogIn, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/utils';
import { formatDateTime } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface ActivityItem {
  id: string;
  type: 'document' | 'access_request' | 'rfid' | 'admin' | 'login' | 'logout';
  message: string;
  user: string;
  timestamp: string;
}

const ACTIVITY_CONFIG: Record<string, { icon: ReactNode; color: string }> = {
  document: { icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-600' },
  access_request: { icon: <ClipboardList className="h-4 w-4" />, color: 'bg-orange-100 text-orange-600' },
  rfid: { icon: <Tag className="h-4 w-4" />, color: 'bg-purple-100 text-purple-600' },
  admin: { icon: <Settings className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600' },
  login: { icon: <LogIn className="h-4 w-4" />, color: 'bg-green-100 text-green-600' },
  logout: { icon: <LogOut className="h-4 w-4" />, color: 'bg-red-100 text-red-600' },
};

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

export function RecentActivity({ activities, onViewAll }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Activite recente</h2>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Voir tout
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune activite recente</p>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => {
              const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.document;
              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 py-3',
                    index < activities.length - 1 && 'border-b border-gray-100'
                  )}
                >
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span>{activity.user}</span>
                      <span>&middot;</span>
                      <span>{formatDateTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
