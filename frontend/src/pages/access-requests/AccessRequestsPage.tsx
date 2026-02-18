import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { useAccessRequests } from '@/hooks/useAccessRequests';
import { formatDate, formatRelative } from '@/lib/utils/utils';
import type { AccessRequest, AccessRequestFilters, AccessRequestStatus, Urgency } from '@/types';

const URGENCY_VARIANTS: Record<Urgency, 'default' | 'info' | 'orange' | 'danger'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'orange',
  CRITICAL: 'danger',
};

const URGENCY_LABELS: Record<Urgency, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  LOAN: 'Pret',
  TRANSFER: 'Transfert',
};

const columns: Column<AccessRequest>[] = [
  {
    key: 'request_number',
    header: 'N. Demande',
    sortable: true,
    render: (ar) => (
      <span className="font-medium text-gray-900">{ar.request_number}</span>
    ),
  },
  {
    key: 'requester',
    header: 'Demandeur',
    render: (ar) => (
      <div>
        <p className="text-sm text-gray-900">{ar.requester.name}</p>
        <p className="text-xs text-gray-500">{ar.requester_site?.name}</p>
      </div>
    ),
  },
  {
    key: 'item',
    header: 'Article',
    render: (ar) => (
      <div>
        <p className="text-sm text-gray-900 truncate max-w-xs">{ar.item.description}</p>
        <p className="text-xs text-gray-500">{ar.item.type}</p>
      </div>
    ),
  },
  {
    key: 'request_type',
    header: 'Type',
    render: (ar) => REQUEST_TYPE_LABELS[ar.request_type] || ar.request_type,
  },
  {
    key: 'urgency',
    header: 'Urgence',
    sortable: true,
    render: (ar) => (
      <Badge variant={URGENCY_VARIANTS[ar.urgency]}>
        {URGENCY_LABELS[ar.urgency]}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (ar) => <StatusBadge status={ar.status} />,
  },
  {
    key: 'requested_at',
    header: 'Demande',
    sortable: true,
    render: (ar) => (
      <div>
        <p className="text-sm">{formatDate(ar.requested_at)}</p>
        {ar.status === 'PENDING' && ar.hours_pending !== undefined && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {ar.hours_pending > 24 && <AlertTriangle className="h-3 w-3 text-red-500" />}
            {formatRelative(ar.requested_at)}
          </p>
        )}
      </div>
    ),
  },
];

const STATUS_TABS: { value: string; label: string; status?: AccessRequestStatus }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente', status: 'PENDING' },
  { value: 'APPROVED', label: 'Approuvees', status: 'APPROVED' },
  { value: 'FULFILLED', label: 'Remises', status: 'FULFILLED' },
  { value: 'OVERDUE', label: 'En retard', status: 'OVERDUE' },
  { value: 'RETURNED', label: 'Retournees', status: 'RETURNED' },
];

export default function AccessRequestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<AccessRequestFilters>({
    page: 1,
    page_size: 25,
  });

  const currentFilters: AccessRequestFilters = {
    ...filters,
    status: activeTab !== 'all' ? (activeTab as AccessRequestStatus) : undefined,
  };

  const { data, isLoading } = useAccessRequests(currentFilters);

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const tabs = STATUS_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d'acces"
        description="Gestion des demandes d'acces aux articles stockes"
        actions={
          <Button icon={<Plus className="h-4 w-4" />}>
            Nouvelle demande
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <div className="p-4">
          <Input
            placeholder="Rechercher par numero, demandeur..."
            iconLeft={<Search className="h-4 w-4" />}
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
      </Card>

      {/* Tabs + Table */}
      <Card>
        <Tabs tabs={tabs} value={activeTab} onValueChange={(val) => { setActiveTab(val); setFilters((prev) => ({ ...prev, page: 1 })); }}>
          <TabContent value={activeTab} className="pt-0">
            <DataTable
              columns={columns}
              data={data?.items ?? []}
              loading={isLoading}
              pagination={data?.pagination}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSort={handleSort}
              onRowClick={(ar) => navigate(`/access-requests/${ar.id}`)}
              rowKey={(ar) => ar.id}
              emptyTitle="Aucune demande"
              emptyDescription="Aucune demande d'acces ne correspond aux criteres"
              emptyAction={
                <Button icon={<Plus className="h-4 w-4" />}>
                  Creer une demande
                </Button>
              }
            />
          </TabContent>
        </Tabs>
      </Card>
    </div>
  );
}
