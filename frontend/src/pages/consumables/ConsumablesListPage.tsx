import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Beaker, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ConsumableForm } from '@/components/features/consumables/ConsumableForm';
import { useConsumables, useCreateConsumable } from '@/hooks/useConsumables';
import { formatDate } from '@/lib/utils/utils';
import type { Consumable, ConsumableFilters, ConsumableType, CreateConsumableRequest } from '@/types';

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'REAGENT', label: 'Reactif' },
  { value: 'TUBE', label: 'Tube' },
  { value: 'PIPETTE_TIP', label: 'Embout pipette' },
  { value: 'CULTURE_MEDIA', label: 'Milieu de culture' },
  { value: 'GLOVE', label: 'Gant' },
  { value: 'SWAB', label: 'Ecouvillon' },
];

const TYPE_LABELS: Record<ConsumableType, string> = {
  REAGENT: 'Reactif',
  TUBE: 'Tube',
  PIPETTE_TIP: 'Embout pipette',
  CULTURE_MEDIA: 'Milieu de culture',
  GLOVE: 'Gant',
  SWAB: 'Ecouvillon',
};

function isExpiringSoon(date: string): boolean {
  const expiry = new Date(date);
  const now = new Date();
  const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil <= 30 && daysUntil > 0;
}

function isExpired(date: string): boolean {
  return new Date(date) < new Date();
}

const columns: Column<Consumable>[] = [
  {
    key: 'catalog_number',
    header: 'Ref. Catalogue',
    sortable: true,
    render: (c) => (
      <div className="flex items-center gap-2">
        <Beaker className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-900">{c.catalog_number}</span>
      </div>
    ),
  },
  {
    key: 'consumable_type',
    header: 'Type',
    sortable: true,
    render: (c) => <Badge variant="success">{TYPE_LABELS[c.consumable_type]}</Badge>,
  },
  {
    key: 'manufacturer',
    header: 'Fabricant',
    render: (c) => c.manufacturer,
  },
  {
    key: 'lot_number',
    header: 'Lot',
    render: (c) => c.lot_number,
  },
  {
    key: 'quantity',
    header: 'Quantite',
    sortable: true,
    render: (c) => `${c.quantity} ${c.unit.toLowerCase()}`,
  },
  {
    key: 'expiry_date',
    header: 'Expiration',
    sortable: true,
    render: (c) => {
      const expired = isExpired(c.expiry_date);
      const expiring = isExpiringSoon(c.expiry_date);

      return (
        <div className="flex items-center gap-1.5">
          {(expired || expiring) && (
            <AlertTriangle className={`h-3.5 w-3.5 ${expired ? 'text-red-500' : 'text-yellow-500'}`} />
          )}
          <span className={expired ? 'text-red-600 font-medium' : expiring ? 'text-yellow-600' : ''}>
            {formatDate(c.expiry_date)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'hazardous',
    header: 'Dangereux',
    render: (c) =>
      c.hazardous ? (
        <Badge variant="danger">Oui</Badge>
      ) : (
        <span className="text-gray-400">Non</span>
      ),
  },
  {
    key: 'status',
    header: 'Statut',
    render: (c) => <StatusBadge status={c.status} />,
  },
];

export default function ConsumablesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<ConsumableFilters>({
    page: 1,
    page_size: 25,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useConsumables(filters);
  const createConsumable = useCreateConsumable();

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = (payload: CreateConsumableRequest) => {
    createConsumable.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Consommable enregistre' });
        setShowCreateModal(false);
      },
      onError: () => toast({ variant: 'error', title: "Erreur lors de l'enregistrement" }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consommables"
        description="Gestion des consommables de laboratoire"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nouveau consommable
          </Button>
        }
      />

      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Rechercher..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
            <Select
              options={TYPE_OPTIONS}
              value={filters.consumable_type || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  consumable_type: (val || undefined) as ConsumableType | undefined,
                  page: 1,
                }))
              }
              placeholder="Type"
            />
            <Select
              options={[
                { value: '', label: 'Tous' },
                { value: 'true', label: 'Dangereux' },
                { value: 'false', label: 'Non dangereux' },
              ]}
              value={filters.hazardous === undefined ? '' : String(filters.hazardous)}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  hazardous: val === '' ? undefined : val === 'true',
                  page: 1,
                }))
              }
              placeholder="Dangerosité"
            />
          </div>
        </div>
      </Card>

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
          onRowClick={(c) => navigate(`/consumables/${c.id}`)}
          rowKey={(c) => c.id}
          emptyTitle="Aucun consommable"
          emptyDescription="Aucun consommable ne correspond aux filtres"
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Enregistrer un consommable"
        description="Ajoutez un nouveau consommable au systeme"
      >
        <ConsumableForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createConsumable.isPending}
        />
      </Modal>
    </div>
  );
}
