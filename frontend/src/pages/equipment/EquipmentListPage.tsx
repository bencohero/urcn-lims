import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Microscope, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { useEquipment } from '@/hooks/useEquipment';
import { formatDate } from '@/lib/utils';
import type { Equipment, EquipmentFilters, EquipmentType } from '@/types';

const EQUIPMENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'CENTRIFUGE', label: 'Centrifugeuse' },
  { value: 'REFRIGERATOR', label: 'Refrigerateur' },
  { value: 'FREEZER', label: 'Congelateur' },
  { value: 'INCUBATOR', label: 'Incubateur' },
  { value: 'MICROSCOPE', label: 'Microscope' },
  { value: 'BALANCE', label: 'Balance' },
  { value: 'PH_METER', label: 'pH-metre' },
];

const TYPE_LABELS: Record<EquipmentType, string> = {
  CENTRIFUGE: 'Centrifugeuse',
  REFRIGERATOR: 'Refrigerateur',
  FREEZER: 'Congelateur',
  INCUBATOR: 'Incubateur',
  MICROSCOPE: 'Microscope',
  BALANCE: 'Balance',
  PH_METER: 'pH-metre',
};

function isCalibrationDueSoon(date?: string): boolean {
  if (!date) return false;
  const due = new Date(date);
  const now = new Date();
  const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil <= 30 && daysUntil > 0;
}

function isCalibrationOverdue(date?: string): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

const columns: Column<Equipment>[] = [
  {
    key: 'serial_number',
    header: 'N/S',
    sortable: true,
    render: (eq) => (
      <div className="flex items-center gap-2">
        <Microscope className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-900">{eq.serial_number}</span>
      </div>
    ),
  },
  {
    key: 'equipment_type',
    header: 'Type',
    sortable: true,
    render: (eq) => <Badge variant="purple">{TYPE_LABELS[eq.equipment_type]}</Badge>,
  },
  {
    key: 'manufacturer',
    header: 'Fabricant / Modele',
    render: (eq) => (
      <div>
        <p className="text-sm text-gray-900">{eq.manufacturer}</p>
        <p className="text-xs text-gray-500">{eq.model}</p>
      </div>
    ),
  },
  {
    key: 'site',
    header: 'Site',
    render: (eq) => eq.site?.name || '-',
  },
  {
    key: 'operational_status',
    header: 'Etat',
    sortable: true,
    render: (eq) => <StatusBadge status={eq.operational_status} />,
  },
  {
    key: 'next_calibration_date',
    header: 'Prochaine calibration',
    sortable: true,
    render: (eq) => {
      if (!eq.calibration_required) return <span className="text-gray-400">N/A</span>;
      if (!eq.next_calibration_date) return <span className="text-gray-400">-</span>;

      const overdue = isCalibrationOverdue(eq.next_calibration_date);
      const dueSoon = isCalibrationDueSoon(eq.next_calibration_date);

      return (
        <div className="flex items-center gap-1.5">
          {(overdue || dueSoon) && (
            <AlertTriangle className={`h-3.5 w-3.5 ${overdue ? 'text-red-500' : 'text-yellow-500'}`} />
          )}
          <span className={overdue ? 'text-red-600 font-medium' : dueSoon ? 'text-yellow-600' : ''}>
            {formatDate(eq.next_calibration_date)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Stockage',
    render: (eq) => <StatusBadge status={eq.status} />,
  },
];

export default function EquipmentListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EquipmentFilters>({
    page: 1,
    page_size: 25,
  });

  const { data, isLoading } = useEquipment(filters);

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
        title="Equipements"
        description="Gestion des equipements de laboratoire"
        actions={
          <Button icon={<Plus className="h-4 w-4" />}>
            Nouvel equipement
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Rechercher par N/S, fabricant..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
            <Select
              options={EQUIPMENT_TYPE_OPTIONS}
              value={filters.equipment_type || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  equipment_type: (val || undefined) as EquipmentType | undefined,
                  page: 1,
                }))
              }
              placeholder="Type d'equipement"
            />
            <Select
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'IN_STORAGE', label: 'En stock' },
                { value: 'CHECKED_OUT', label: 'Sorti' },
                { value: 'IN_TRANSIT', label: 'En transit' },
              ]}
              value={filters.status || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (val || undefined) as EquipmentFilters['status'],
                  page: 1,
                }))
              }
              placeholder="Statut"
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
          onRowClick={(eq) => navigate(`/equipment/${eq.id}`)}
          rowKey={(eq) => eq.id}
          emptyTitle="Aucun equipement"
          emptyDescription="Aucun equipement ne correspond aux filtres"
        />
      </Card>
    </div>
  );
}
