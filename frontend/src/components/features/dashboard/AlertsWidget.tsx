import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils/utils';

interface AlertItem {
  title: string;
  count: number;
  variant: 'danger' | 'warning' | 'info';
  description: string;
}

interface AlertsWidgetProps {
  alerts: AlertItem[];
}

const styles: Record<string, string> = {
  danger: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
};

const iconStyles: Record<string, string> = {
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const activeAlerts = alerts.filter((a) => a.count > 0);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alertes
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune alerte</p>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.title}
              className={cn('flex items-center gap-3 rounded-lg border p-3', styles[alert.variant])}
            >
              <AlertTriangle className={cn('h-5 w-5 shrink-0', iconStyles[alert.variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {alert.title}: <span className="font-bold">{alert.count}</span>
                </p>
                <p className="text-xs text-gray-600">{alert.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
