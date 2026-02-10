import { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { useAuditTrail, useVerifyIntegrity } from '@/hooks/useAuditTrail';
import { auditTrailApi } from '@/lib/api/auditTrail';
import { formatDateTime } from '@/lib/utils/utils';
import type { AuditEntry, AuditTrailFilters, AuditEventType } from '@/types';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'CREATE', label: 'Creation' },
  { value: 'UPDATE', label: 'Modification' },
  { value: 'DELETE', label: 'Suppression' },
];

const EVENT_VARIANTS: Record<AuditEventType, 'success' | 'info' | 'danger'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
};

const EVENT_LABELS: Record<AuditEventType, string> = {
  CREATE: 'Creation',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
};

const TABLE_LABELS: Record<string, string> = {
  documents: 'Documents',
  equipment: 'Equipements',
  consumables: 'Consommables',
  access_requests: 'Demandes',
  users: 'Utilisateurs',
  rfid_tags: 'Tags RFID',
  storage_locations: 'Emplacements',
  containers: 'Conteneurs',
  studies: 'Etudes',
  sites: 'Sites',
};

const columns: Column<AuditEntry>[] = [
  {
    key: 'timestamp',
    header: 'Date/Heure',
    sortable: true,
    render: (entry) => (
      <span className="text-xs whitespace-nowrap">{formatDateTime(entry.timestamp)}</span>
    ),
  },
  {
    key: 'event_type',
    header: 'Action',
    sortable: true,
    render: (entry) => (
      <Badge variant={EVENT_VARIANTS[entry.event_type]}>
        {EVENT_LABELS[entry.event_type]}
      </Badge>
    ),
  },
  {
    key: 'table_name',
    header: 'Table',
    render: (entry) => TABLE_LABELS[entry.table_name] || entry.table_name,
  },
  {
    key: 'record_id',
    header: 'ID Enreg.',
    render: (entry) => (
      <code className="text-xs text-gray-600">{entry.record_id.slice(0, 8)}</code>
    ),
  },
  {
    key: 'user',
    header: 'Utilisateur',
    render: (entry) => (
      <div>
        <p className="text-sm text-gray-900">{entry.user.full_name}</p>
        <p className="text-xs text-gray-500">@{entry.user.username}</p>
      </div>
    ),
  },
  {
    key: 'action',
    header: 'Detail',
    render: (entry) => (
      <span className="text-sm text-gray-600 truncate max-w-xs block">{entry.action}</span>
    ),
  },
  {
    key: 'ip_address',
    header: 'IP',
    render: (entry) => <code className="text-xs text-gray-500">{entry.ip_address}</code>,
  },
];

export default function AuditTrailPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditTrailFilters>({
    page: 1,
    page_size: 50,
  });

  const { data, isLoading } = useAuditTrail(filters);
  const verifyIntegrity = useVerifyIntegrity();

  const handleVerifyIntegrity = () => {
    verifyIntegrity.mutate(undefined, {
      onSuccess: (result) => {
        if (result.integrity_valid) {
          toast({
            variant: 'success',
            title: 'Integrite verifiee',
            description: `${result.total_records_checked} enregistrements verifies`,
          });
        } else {
          toast({
            variant: 'error',
            title: 'Chaine d\'integrite rompue',
            description: 'Des anomalies ont ete detectees',
          });
        }
      },
      onError: () => toast({ variant: 'error', title: 'Erreur de verification' }),
    });
  };

  const handleExport = async () => {
    try {
      const blob = await auditTrailApi.export({
        format: 'csv',
        event_type: filters.event_type,
        table_name: filters.table_name,
        from_timestamp: filters.from_timestamp,
        to_timestamp: filters.to_timestamp,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ variant: 'success', title: 'Export telecharge' });
    } catch {
      toast({ variant: 'error', title: 'Erreur d\'export' });
    }
  };

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
        title="Piste d'audit"
        description="Journal d'audit immutable avec verification d'integrite SHA-256"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={handleVerifyIntegrity}
              loading={verifyIntegrity.isPending}
            >
              Verifier l'integrite
            </Button>
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Exporter CSV
            </Button>
          </div>
        }
      />

      {/* Integrity Status */}
      {verifyIntegrity.data && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              {verifyIntegrity.data.integrity_valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Chaine d'integrite valide - {verifyIntegrity.data.total_records_checked} enregistrements verifies
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Rupture detectee dans la chaine d'integrite
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Rechercher..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
            <Select
              options={EVENT_TYPE_OPTIONS}
              value={filters.event_type || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  event_type: (val || undefined) as AuditEventType | undefined,
                  page: 1,
                }))
              }
              placeholder="Type d'evenement"
            />
            <Input
              type="date"
              placeholder="Depuis"
              value={filters.from_timestamp || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, from_timestamp: e.target.value || undefined, page: 1 }))}
            />
            <Input
              type="date"
              placeholder="Jusqu'a"
              value={filters.to_timestamp || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, to_timestamp: e.target.value || undefined, page: 1 }))}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
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
          rowKey={(entry) => entry.id}
          emptyTitle="Aucune entree d'audit"
          emptyDescription="Aucune entree ne correspond aux filtres"
        />
      </Card>
    </div>
  );
}
