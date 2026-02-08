import {
  FileText,
  Microscope,
  Beaker,
  ClipboardList,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDashboardStatistics } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconBg: string;
  change?: number;
  href?: string;
}

function KPICard({ title, value, icon, iconBg, change, href }: KPICardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(href && 'cursor-pointer hover:shadow-md transition-shadow')}
    >
      <CardContent className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('fr-FR')}</p>
            {change !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  change >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        {href && (
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={() => navigate(href)}
            aria-label={`Voir ${title}`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({
  title,
  count,
  variant,
  description,
}: {
  title: string;
  count: number;
  variant: 'danger' | 'warning' | 'info';
  description: string;
}) {
  if (count === 0) return null;

  const styles = {
    danger: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50',
  };

  const iconStyles = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', styles[variant])}>
      <AlertTriangle className={cn('h-5 w-5 shrink-0', iconStyles[variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">
          {title}: <span className="font-bold">{count}</span>
        </p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function CapacityBar({ label, percent }: { label: string; percent: number }) {
  const color =
    percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
        <div
          className={cn('h-2 rounded-full transition-all', color)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStatistics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const greeting = `Bonjour, ${user?.first_name || 'Utilisateur'}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description="Vue d'ensemble du systeme de stockage clinique"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Documents"
          value={stats?.inventory.total_documents ?? 0}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-100"
          href="/documents"
        />
        <KPICard
          title="Equipements"
          value={stats?.inventory.total_equipment ?? 0}
          icon={<Microscope className="h-6 w-6 text-purple-600" />}
          iconBg="bg-purple-100"
          href="/equipment"
        />
        <KPICard
          title="Consommables"
          value={stats?.inventory.total_consumables ?? 0}
          icon={<Beaker className="h-6 w-6 text-green-600" />}
          iconBg="bg-green-100"
          href="/consumables"
        />
        <KPICard
          title="Demandes en attente"
          value={stats?.access_requests.pending ?? 0}
          icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
          iconBg="bg-orange-100"
          href="/access-requests"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertes
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <AlertCard
              title="Calibrations a venir"
              count={stats?.alerts.calibration_due_soon ?? 0}
              variant="warning"
              description="Equipements necessitant une calibration dans les 30 jours"
            />
            <AlertCard
              title="Expirations proches"
              count={stats?.alerts.items_expiring_30_days ?? 0}
              variant="warning"
              description="Consommables expirant dans les 30 jours"
            />
            <AlertCard
              title="Retours en retard"
              count={stats?.alerts.overdue_returns ?? 0}
              variant="danger"
              description="Articles non retournes dans les delais"
            />
            {(stats?.alerts.calibration_due_soon ?? 0) === 0 &&
              (stats?.alerts.items_expiring_30_days ?? 0) === 0 &&
              (stats?.alerts.overdue_returns ?? 0) === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune alerte</p>
              )}
          </CardContent>
        </Card>

        {/* Access Requests Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary-500" />
              Demandes d'acces
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="En attente" value={stats?.access_requests.pending ?? 0} variant="warning" />
              <StatBlock label="Approuvees" value={stats?.access_requests.approved ?? 0} variant="success" />
              <StatBlock label="En retard" value={stats?.access_requests.overdue ?? 0} variant="danger" />
              <StatBlock label="Remplies" value={stats?.access_requests.fulfilled ?? 0} variant="info" />
            </div>
            {stats?.access_requests.average_approval_time_hours !== undefined && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Delai moyen d'approbation:{' '}
                  <span className="font-medium text-gray-900">
                    {stats.access_requests.average_approval_time_hours.toFixed(1)}h
                  </span>
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = '/access-requests'}
            >
              Voir toutes les demandes
            </Button>
          </CardContent>
        </Card>

        {/* Storage Capacity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Capacite de stockage</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <CapacityBar
              label="Utilisation globale"
              percent={stats?.storage_capacity.usage_percent ?? 0}
            />
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {stats?.storage_capacity.current_usage.toLocaleString('fr-FR') ?? 0}
                </span>
                {' / '}
                {stats?.storage_capacity.total_capacity.toLocaleString('fr-FR') ?? 0} emplacements utilises
              </p>
            </div>
            {(stats?.storage_capacity.locations_above_90_percent ?? 0) > 0 && (
              <Badge variant="danger">
                {stats?.storage_capacity.locations_above_90_percent} emplacement(s) &gt; 90%
              </Badge>
            )}

            {/* Movements summary */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Mouvements (30 jours)</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-green-700">{stats?.movements.entries ?? 0}</p>
                  <p className="text-xs text-green-600">Entrees</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-bold text-red-700">{stats?.movements.exits ?? 0}</p>
                  <p className="text-xs text-red-600">Sorties</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2">
                  <p className="text-lg font-bold text-blue-700">{stats?.movements.returns ?? 0}</p>
                  <p className="text-xs text-blue-600">Retours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'warning' | 'success' | 'danger' | 'info';
}) {
  const bg = {
    warning: 'bg-yellow-50',
    success: 'bg-green-50',
    danger: 'bg-red-50',
    info: 'bg-blue-50',
  };
  const text = {
    warning: 'text-yellow-700',
    success: 'text-green-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
  };

  return (
    <div className={cn('rounded-lg p-3 text-center', bg[variant])}>
      <p className={cn('text-xl font-bold', text[variant])}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}
