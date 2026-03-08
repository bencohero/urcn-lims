import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Package, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  useStorageLocations,
  useCreateStorageLocation,
  useContainers,
  useCreateContainer,
} from '@/hooks/useStorage';
import type { StorageLocation, Container, ContainerType, LocationType } from '@/types';
import type { CreateStorageLocationRequest, CreateContainerRequest } from '@/lib/api/storage';

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCATION_TYPE_CREATE_OPTIONS = [
  { value: 'ROOM', label: 'Salle' },
  { value: 'ZONE', label: 'Zone' },
  { value: 'AREA', label: 'Aire' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
];

const CONTAINER_TYPE_OPTIONS = [
  { value: 'CABINET', label: 'Armoire' },
  { value: 'SHELF', label: 'Etagere' },
  { value: 'BOX', label: 'Boite' },
  { value: 'DRAWER', label: 'Tiroir' },
  { value: 'RACK', label: 'Rack' },
];

const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  CABINET: 'Armoire',
  SHELF: 'Etagere',
  BOX: 'Boite',
  DRAWER: 'Tiroir',
  RACK: 'Rack',
};

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ROOM: 'Salle',
  ZONE: 'Zone',
  AREA: 'Aire',
};

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createLocationSchema = z
  .object({
    site_id: z.string().uuid('UUID du site invalide'),
    name: z.string().min(1, 'Nom requis'),
    code: z.string().min(1, 'Code requis'),
    location_type: z.enum(['ROOM', 'ZONE', 'AREA'], { required_error: 'Type requis' }),
    building: z.string().optional(),
    floor: z.string().optional(),
    temperature_controlled: z.boolean().default(false),
    temperature_min: z.coerce.number().optional(),
    temperature_max: z.coerce.number().optional(),
    access_restricted: z.boolean().default(false),
    capacity_cubic_meters: z.coerce.number().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.temperature_controlled) {
        return data.temperature_min !== undefined && data.temperature_max !== undefined;
      }
      return true;
    },
    {
      message: 'Temperatures min et max requises si temperature controlee',
      path: ['temperature_min'],
    },
  );

type CreateLocationFormValues = z.infer<typeof createLocationSchema>;

const createContainerSchema = z.object({
  location_id: z.string().uuid(),
  container_type: z.enum(['CABINET', 'SHELF', 'BOX', 'DRAWER', 'RACK'], {
    required_error: 'Type requis',
  }),
  name: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  capacity_items: z.coerce.number().int().positive('Capacite requise'),
  dimensions_cm: z.string().optional(),
  locked: z.boolean().default(false),
});

type CreateContainerFormValues = z.infer<typeof createContainerSchema>;

// ─── Sub-components ──────────────────────────────────────────────────────────

function CreateLocationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const createLocation = useCreateStorageLocation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLocationFormValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      temperature_controlled: false,
      access_restricted: false,
    },
  });

  const tempControlled = watch('temperature_controlled');

  const onSubmit = (values: CreateLocationFormValues) => {
    const payload: CreateStorageLocationRequest = {
      site_id: values.site_id,
      name: values.name,
      code: values.code,
      location_type: values.location_type,
      building: values.building || undefined,
      floor: values.floor || undefined,
      temperature_controlled: values.temperature_controlled,
      temperature_min: values.temperature_controlled ? values.temperature_min : undefined,
      temperature_max: values.temperature_controlled ? values.temperature_max : undefined,
      access_restricted: values.access_restricted,
      capacity_cubic_meters: values.capacity_cubic_meters || undefined,
    };

    createLocation.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Emplacement cree avec succes' });
        reset();
        onOpenChange(false);
      },
      onError: () => toast({ variant: 'error', title: "Erreur lors de la creation de l'emplacement" }),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
      title="Nouvel emplacement"
      description="Ajouter un nouvel emplacement de stockage"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="ID du site (UUID)"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          error={errors.site_id?.message}
          {...register('site_id')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom"
            required
            placeholder="Salle de stockage A"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Code"
            required
            placeholder="SSA-001"
            error={errors.code?.message}
            {...register('code')}
          />
        </div>
        <Controller
          control={control}
          name="location_type"
          render={({ field }) => (
            <Select
              label="Type d'emplacement"
              required
              options={LOCATION_TYPE_CREATE_OPTIONS}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.location_type?.message}
              placeholder="Selectionner un type"
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Batiment"
            placeholder="Batiment A"
            {...register('building')}
          />
          <Input
            label="Etage"
            placeholder="1er etage"
            {...register('floor')}
          />
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('temperature_controlled')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Temperature controlee</span>
          </label>
          {tempControlled && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <Input
                label="Temp. min (°C)"
                type="number"
                placeholder="-20"
                error={errors.temperature_min?.message}
                {...register('temperature_min')}
              />
              <Input
                label="Temp. max (°C)"
                type="number"
                placeholder="4"
                error={errors.temperature_max?.message}
                {...register('temperature_max')}
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('access_restricted')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Acces restreint</span>
          </label>
        </div>
        <Input
          label="Capacite (m³)"
          type="number"
          step="0.1"
          placeholder="25.0"
          {...register('capacity_cubic_meters')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            Annuler
          </Button>
          <Button type="submit" loading={createLocation.isPending}>
            Creer l'emplacement
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateContainerModal({
  open,
  onOpenChange,
  locationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locationId: string;
}) {
  const { toast } = useToast();
  const createContainer = useCreateContainer();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateContainerFormValues>({
    resolver: zodResolver(createContainerSchema),
    defaultValues: {
      location_id: locationId,
      locked: false,
    },
  });

  const onSubmit = (values: CreateContainerFormValues) => {
    const payload: CreateContainerRequest = {
      location_id: locationId,
      container_type: values.container_type,
      name: values.name,
      code: values.code,
      capacity_items: values.capacity_items,
      dimensions_cm: values.dimensions_cm || undefined,
      locked: values.locked,
    };

    createContainer.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Conteneur cree avec succes' });
        reset();
        onOpenChange(false);
      },
      onError: () => toast({ variant: 'error', title: 'Erreur lors de la creation du conteneur' }),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
      title="Nouveau conteneur"
      description="Ajouter un conteneur dans l'emplacement selectionne"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          control={control}
          name="container_type"
          render={({ field }) => (
            <Select
              label="Type de conteneur"
              required
              options={CONTAINER_TYPE_OPTIONS}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.container_type?.message}
              placeholder="Selectionner un type"
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom"
            required
            placeholder="Armoire principale"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Code"
            required
            placeholder="ARM-001"
            error={errors.code?.message}
            {...register('code')}
          />
        </div>
        <Input
          label="Capacite (nombre d'articles)"
          type="number"
          required
          placeholder="100"
          error={errors.capacity_items?.message}
          {...register('capacity_items')}
        />
        <Input
          label="Dimensions (L x l x h cm)"
          placeholder="200 x 60 x 180"
          {...register('dimensions_cm')}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('locked')} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <span className="text-sm font-medium text-gray-700">Verrouille</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            Annuler
          </Button>
          <Button type="submit" loading={createContainer.isPending}>
            Creer le conteneur
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Column Definitions ───────────────────────────────────────────────────────

function buildLocationColumns(selectedId: string | null): Column<StorageLocation>[] {
  return [
    {
      key: 'name',
      header: 'Nom',
      render: (loc) => (
        <div className="flex items-center gap-2">
          <MapPin
            className={`h-4 w-4 shrink-0 ${selectedId === loc.id ? 'text-primary-500' : 'text-gray-400'}`}
          />
          <span
            className={`font-medium ${selectedId === loc.id ? 'text-primary-700' : 'text-gray-900'}`}
          >
            {loc.name}
          </span>
          {selectedId === loc.id && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary-500 inline-block" />
          )}
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (loc) => <span className="font-mono text-sm text-gray-600">{loc.code}</span>,
    },
    {
      key: 'location_type',
      header: 'Type',
      render: (loc) => <Badge variant="info">{LOCATION_TYPE_LABELS[loc.location_type]}</Badge>,
    },
    {
      key: 'temperature_controlled',
      header: 'Conditions',
      render: (loc) =>
        loc.temperature_controlled ? (
          <Badge variant="info">Temp. controlee</Badge>
        ) : (
          <span className="text-gray-400 text-xs">Ambiante</span>
        ),
    },
    {
      key: 'items_count',
      header: 'Articles',
      render: (loc) => (
        <span className="text-sm text-gray-700">{loc.items_count ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (loc) => <StatusBadge status={loc.status} />,
    },
  ];
}

const containerColumns: Column<Container>[] = [
  {
    key: 'name',
    header: 'Nom',
    render: (c) => (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="font-medium text-gray-900">{c.name}</span>
      </div>
    ),
  },
  {
    key: 'code',
    header: 'Code',
    render: (c) => <span className="font-mono text-sm text-gray-600">{c.code}</span>,
  },
  {
    key: 'container_type',
    header: 'Type',
    render: (c) => <Badge variant="purple">{CONTAINER_TYPE_LABELS[c.container_type]}</Badge>,
  },
  {
    key: 'current_count',
    header: 'Occupation',
    render: (c) => (
      <span className="text-sm text-gray-700">
        {c.current_count}/{c.capacity_items}
      </span>
    ),
  },
  {
    key: 'usage_percent',
    header: 'Remplissage',
    render: (c) => {
      const pct = c.usage_percent ?? 0;
      const colorClass =
        pct > 80 ? 'text-red-600 font-semibold' : pct > 60 ? 'text-yellow-600 font-medium' : 'text-gray-700';
      return <span className={`text-sm ${colorClass}`}>{pct.toFixed(0)} %</span>;
    },
  },
  {
    key: 'locked',
    header: 'Verrou',
    render: (c) =>
      c.locked ? (
        <Badge variant="warning">Verrouille</Badge>
      ) : (
        <span className="text-gray-400 text-xs">-</span>
      ),
  },
  {
    key: 'status',
    header: 'Statut',
    render: (c) => <StatusBadge status={c.status} />,
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StorageLocationsPage() {
  const [siteIdInput, setSiteIdInput] = useState('');
  const [appliedSiteId, setAppliedSiteId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [showCreateContainerModal, setShowCreateContainerModal] = useState(false);

  const locationFilters = {
    site_id: appliedSiteId,
    status: (statusFilter || undefined) as 'ACTIVE' | 'INACTIVE' | undefined,
  };

  const { data: locationsData, isLoading: locationsLoading } = useStorageLocations(locationFilters);
  const { data: containersData, isLoading: containersLoading } = useContainers(
    selectedLocationId ? { location_id: selectedLocationId } : undefined,
  );

  const locationColumns = buildLocationColumns(selectedLocationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emplacements de stockage"
        description="Gestion des emplacements et conteneurs"
      />

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <Input
                label="ID du site"
                placeholder="UUID du site..."
                value={siteIdInput}
                onChange={(e) => setSiteIdInput(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Statut"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'ACTIVE' | 'INACTIVE' | '')}
                placeholder="Tous les statuts"
              />
            </div>
            <Button
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setAppliedSiteId(siteIdInput.trim() || undefined)}
            >
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 1 – Emplacements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Emplacements</h2>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateLocationModal(true)}
              >
                Nouvel emplacement
              </Button>
            </div>
          </CardHeader>
          <DataTable
            columns={locationColumns}
            data={locationsData?.items ?? []}
            loading={locationsLoading}
            pagination={locationsData?.pagination}
            rowKey={(loc) => loc.id}
            onRowClick={(loc) =>
              setSelectedLocationId((prev) => (prev === loc.id ? null : loc.id))
            }
            emptyTitle="Aucun emplacement"
            emptyDescription="Aucun emplacement ne correspond aux filtres"
          />
        </Card>

        {/* Section 2 – Conteneurs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Conteneurs de l'emplacement selectionne
              </h2>
              <Button
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                disabled={!selectedLocationId}
                onClick={() => setShowCreateContainerModal(true)}
              >
                Nouveau conteneur
              </Button>
            </div>
          </CardHeader>
          {!selectedLocationId ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">Selectionnez un emplacement</p>
              <p className="text-xs text-gray-400 mt-1">
                Cliquez sur un emplacement dans la liste de gauche pour voir ses conteneurs
              </p>
            </div>
          ) : (
            <DataTable
              columns={containerColumns}
              data={containersData?.items ?? []}
              loading={containersLoading}
              pagination={containersData?.pagination}
              rowKey={(c) => c.id}
              emptyTitle="Aucun conteneur"
              emptyDescription="Cet emplacement ne possede pas encore de conteneurs"
            />
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateLocationModal
        open={showCreateLocationModal}
        onOpenChange={setShowCreateLocationModal}
      />

      {selectedLocationId && (
        <CreateContainerModal
          open={showCreateContainerModal}
          onOpenChange={setShowCreateContainerModal}
          locationId={selectedLocationId}
        />
      )}
    </div>
  );
}
