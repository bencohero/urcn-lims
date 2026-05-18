import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  FileText,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { reportsApi, type DownloadableReportType } from '@/lib/api/reports';

interface ReportTypeConfig {
  value: DownloadableReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
  hasDateRange: boolean;
  hasStatus: boolean;
  hasGroupBy: boolean;
}

const REPORT_TYPES: ReportTypeConfig[] = [
  {
    value: 'inventory',
    label: 'Inventaire',
    description: 'Liste complète de tous les articles stockés',
    icon: <Package className="h-5 w-5" />,
    hasDateRange: false,
    hasStatus: false,
    hasGroupBy: true,
  },
  {
    value: 'movements',
    label: 'Mouvements',
    description: 'Historique des entrées / sorties / transferts',
    icon: <BarChart3 className="h-5 w-5" />,
    hasDateRange: true,
    hasStatus: false,
    hasGroupBy: false,
  },
  {
    value: 'access-requests',
    label: "Demandes d'accès",
    description: 'Rapport des demandes et approbations',
    icon: <Clock className="h-5 w-5" />,
    hasDateRange: true,
    hasStatus: true,
    hasGroupBy: false,
  },
  {
    value: 'audit-trail',
    label: "Piste d'audit",
    description: "Journal d'audit complet (max 1 000 entrées)",
    icon: <ShieldCheck className="h-5 w-5" />,
    hasDateRange: true,
    hasStatus: false,
    hasGroupBy: false,
  },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
];

const GROUP_BY_OPTIONS = [
  { value: '', label: 'Aucun regroupement' },
  { value: 'type', label: 'Par type' },
  { value: 'status', label: 'Par statut' },
  { value: 'location', label: 'Par emplacement' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvé' },
  { value: 'REJECTED', label: 'Rejeté' },
  { value: 'FULFILLED', label: 'Satisfait' },
  { value: 'RETURNED', label: 'Retourné' },
];

const PERIOD_OPTIONS = [
  { value: 'day', label: "Aujourd'hui" },
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: '30 derniers jours' },
  { value: 'year', label: '12 derniers mois' },
];

function StatCard({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorMap[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<DownloadableReportType>('inventory');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const config = REPORT_TYPES.find((r) => r.value === selectedType)!;

  const { data: statistics, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['report-statistics', statsPeriod],
    queryFn: () => reportsApi.getStatistics({ period: statsPeriod }),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await reportsApi.download(selectedType, {
        format,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        group_by: groupBy || undefined,
        status: status || undefined,
      });

      const ext = format === 'excel' ? 'xlsx' : format;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${selectedType}-${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ variant: 'success', title: 'Rapport téléchargé avec succès' });
    } catch {
      toast({ variant: 'error', title: 'Erreur lors du téléchargement', description: 'Veuillez réessayer' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Génération et téléchargement de rapports"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: type selection */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Type de rapport</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setSelectedType(rt.value)}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  selectedType === rt.value
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className={`rounded-lg p-2 ${
                    selectedType === rt.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rt.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{rt.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{rt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: parameters + download */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Paramètres</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Format"
              options={FORMAT_OPTIONS}
              value={format}
              onValueChange={(val) => setFormat(val as 'pdf' | 'excel' | 'csv')}
            />

            {config.hasDateRange && (
              <>
                <Input
                  label="Date début"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <Input
                  label="Date fin"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </>
            )}

            {config.hasGroupBy && (
              <Select
                label="Regroupement"
                options={GROUP_BY_OPTIONS}
                value={groupBy}
                onValueChange={setGroupBy}
              />
            )}

            {config.hasStatus && (
              <Select
                label="Statut"
                options={STATUS_OPTIONS}
                value={status}
                onValueChange={setStatus}
              />
            )}

            <div className="border-t border-gray-100 pt-4">
              <Button
                className="w-full"
                icon={<Download className="h-4 w-4" />}
                onClick={handleDownload}
                loading={downloading}
              >
                Télécharger le rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Statistiques</h2>
          <div className="flex items-center gap-2">
            <Select
              options={PERIOD_OPTIONS}
              value={statsPeriod}
              onValueChange={(val) => setStatsPeriod(val as typeof statsPeriod)}
            />
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />}
              onClick={() => refetchStats()}
            >
              Actualiser
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : statistics ? (
          <div className="space-y-4">
            {/* Inventory */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Inventaire
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total articles" value={statistics.inventory.total_items} color="blue" />
                <StatCard label="Documents" value={statistics.inventory.total_documents} color="purple" />
                <StatCard label="Équipements" value={statistics.inventory.total_equipment} color="green" />
                <StatCard label="Consommables" value={statistics.inventory.total_consumables} color="orange" />
              </div>
            </div>

            {/* Movements */}
            {statistics.movements && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Mouvements (période)
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Entrées" value={statistics.movements.entries} color="green"
                    sub={<span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /></span> as unknown as string}
                  />
                  <StatCard label="Sorties" value={statistics.movements.exits} color="orange" />
                  <StatCard label="Retours" value={statistics.movements.returns} color="blue" />
                  <StatCard
                    label="Variation nette"
                    value={statistics.movements.net_change >= 0
                      ? `+${statistics.movements.net_change}`
                      : statistics.movements.net_change}
                    color={statistics.movements.net_change >= 0 ? 'green' : 'red'}
                  />
                </div>
              </div>
            )}

            {/* Access requests */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Demandes d'accès (période)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total" value={statistics.access_requests.total} color="blue" />
                <StatCard label="En attente" value={statistics.access_requests.pending} color="orange" />
                <StatCard label="Approuvées" value={statistics.access_requests.approved} color="green" />
                <StatCard
                  label="En retard"
                  value={statistics.access_requests.overdue}
                  color={statistics.access_requests.overdue > 0 ? 'red' : 'green'}
                />
              </div>
            </div>

            {/* Alerts */}
            {statistics.alerts.overdue_returns > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {statistics.alerts.overdue_returns} retour{statistics.alerts.overdue_returns > 1 ? 's' : ''} en retard
                  </p>
                  <p className="text-xs text-red-600">
                    Des articles empruntés n'ont pas été retournés à temps
                  </p>
                </div>
                <Badge variant="error" className="ml-auto">
                  {statistics.alerts.overdue_returns}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Impossible de charger les statistiques.</p>
        )}
      </div>
    </div>
  );
}
