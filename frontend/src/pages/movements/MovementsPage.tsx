import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  useMovements,
  useOverdueMovements,
  useCreateMovement,
  useRecordReturn,
} from '@/hooks/useMovements';
import { useUsers } from '@/hooks/useUsers';
import { useContainers, useStorageLocations } from '@/hooks/useStorage';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { equipmentApi } from '@/lib/api/equipment';
import { consumablesApi } from '@/lib/api/consumables';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import type {
  BackendMovementType,
  FullMovement,
  CreateMovementRequest,
  MovementFilters,
} from '@/lib/api/movements';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVEMENT_TYPE_OPTIONS_ALL = [
  { value: '', label: 'Tous les types' },
  { value: 'IN', label: 'Entrée' },
  { value: 'OUT', label: 'Sortie' },
  { value: 'TRANSFER', label: 'Transfert' },
  { value: 'RETURN', label: 'Retour' },
  { value: 'ARCHIVE', label: 'Archivage' },
  { value: 'DESTROY', label: 'Destruction' },
];

const MOVEMENT_TYPE_OPTIONS_CREATE = [
  { value: 'IN', label: 'Entrée' },
  { value: 'OUT', label: 'Sortie' },
  { value: 'TRANSFER', label: 'Transfert interne' },
  { value: 'RETURN', label: 'Retour' },
  { value: 'ARCHIVE', label: 'Archivage' },
  { value: 'DESTROY', label: 'Destruction' },
];

type MovementBadgeVariant = 'danger' | 'success' | 'info' | 'warning' | 'default' | 'orange';

const MOVEMENT_TYPE_VARIANTS: Record<BackendMovementType, MovementBadgeVariant> = {
  IN: 'success',
  OUT: 'danger',
  TRANSFER: 'info',
  RETURN: 'warning',
  ARCHIVE: 'default',
  DESTROY: 'orange',
};

const MOVEMENT_TYPE_LABELS: Record<BackendMovementType, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
  TRANSFER: 'Transfert',
  RETURN: 'Retour',
  ARCHIVE: 'Archivage',
  DESTROY: 'Destruction',
};

type ItemCategory = 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';

const ITEM_CATEGORY_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'EQUIPMENT', label: 'Équipement' },
  { value: 'CONSUMABLE', label: 'Consommable' },
];

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createMovementSchema = z.object({
  stored_item_id: z.string().uuid('Article requis'),
  movement_type: z.enum(['IN', 'OUT', 'TRANSFER', 'RETURN', 'ARCHIVE', 'DESTROY'], {
    required_error: 'Type requis',
  }),
  performed_by_id: z.string().uuid('Utilisateur invalide').optional().or(z.literal('').transform(() => undefined)),
  to_container_id: z.string().uuid('UUID invalide').optional().or(z.literal('').transform(() => undefined)),
  to_location_id: z.string().uuid('UUID invalide').optional().or(z.literal('').transform(() => undefined)),
  from_container_id: z.string().uuid('UUID invalide').optional().or(z.literal('').transform(() => undefined)),
  from_location_id: z.string().uuid('UUID invalide').optional().or(z.literal('').transform(() => undefined)),
  reason: z.string().max(255).optional(),
  notes: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  expected_return_date: z.string().optional(),
});

type CreateMovementFormValues = z.infer<typeof createMovementSchema>;

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateMovementModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const createMovement = useCreateMovement();
  const [itemCategory, setItemCategory] = useState<ItemCategory | ''>('');

  const { data: usersData } = useUsers({ page_size: 100 });
  const { data: containersData } = useContainers({ page_size: 100 });
  const { data: locationsData } = useStorageLocations({ page_size: 100 });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', { page_size: 100 }],
    queryFn: () => documentsApi.getAll({ page_size: 100 }),
    enabled: itemCategory === 'DOCUMENT',
    staleTime: 60_000,
  });
  const { data: eqData, isLoading: eqLoading } = useQuery({
    queryKey: ['equipment', { page_size: 100 }],
    queryFn: () => equipmentApi.getAll({ page_size: 100 }),
    enabled: itemCategory === 'EQUIPMENT',
    staleTime: 60_000,
  });
  const { data: consData, isLoading: consLoading } = useQuery({
    queryKey: ['consumables', { page_size: 100 }],
    queryFn: () => consumablesApi.getAll({ page_size: 100 }),
    enabled: itemCategory === 'CONSUMABLE',
    staleTime: 60_000,
  });

  const itemsLoading = docsLoading || eqLoading || consLoading;

  const itemOptions = useMemo(() => {
    if (itemCategory === 'DOCUMENT' && docsData?.items) {
      return docsData.items.map((d) => ({
        value: d.id,
        label: `${d.document_type} — ${d.subject_id ?? '?'} / ${d.form_name ?? '?'} (v${d.version})`,
      }));
    }
    if (itemCategory === 'EQUIPMENT' && eqData?.items) {
      return eqData.items.map((e) => ({
        value: e.id,
        label: `${e.equipment_type} — ${e.manufacturer} ${e.model} (${e.serial_number})`,
      }));
    }
    if (itemCategory === 'CONSUMABLE' && consData?.items) {
      return consData.items.map((c) => ({
        value: c.id,
        label: `${c.consumable_type} — ${c.manufacturer} / Lot: ${c.lot_number}`,
      }));
    }
    return [];
  }, [itemCategory, docsData, eqData, consData]);

  const userOptions = [
    { value: '', label: '— Utilisateur courant —' },
    ...(usersData?.items ?? []).map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name} (${u.username})`,
    })),
  ];
  const containerOptions = [
    { value: '', label: '— Aucun —' },
    ...(containersData?.items ?? []).map((c) => ({
      value: c.id,
      label: c.code ? `${c.code} – ${c.name}` : c.name,
    })),
  ];
  const locationOptions = [
    { value: '', label: '— Aucun —' },
    ...(locationsData?.items ?? []).map((l) => ({
      value: l.id,
      label: l.code ? `${l.code} – ${l.name}` : l.name,
    })),
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: { quantity: 1 },
  });

  const movementType = watch('movement_type');
  const fromContainerId = watch('from_container_id');
  const fromLocationId = watch('from_location_id');

  const handleCategoryChange = (cat: string) => {
    setItemCategory(cat as ItemCategory | '');
    setValue('stored_item_id', '', { shouldValidate: false });
    setValue('from_container_id', '', { shouldValidate: false });
    setValue('from_location_id', '', { shouldValidate: false });
  };

  const handleItemChange = (itemId: string, onChange: (v: string) => void) => {
    onChange(itemId);
    if (!itemId) return;

    let containerId: string | undefined;
    let locationId: string | undefined;

    if (itemCategory === 'DOCUMENT') {
      const item = docsData?.items?.find((d) => d.id === itemId);
      containerId = item?.container_id || item?.container?.id;
      locationId = item?.location?.id;
    } else if (itemCategory === 'EQUIPMENT') {
      const item = eqData?.items?.find((e) => e.id === itemId);
      containerId = item?.container_id || item?.container?.id;
      locationId = item?.location?.id;
    } else if (itemCategory === 'CONSUMABLE') {
      const item = consData?.items?.find((c) => c.id === itemId);
      containerId = item?.container_id || item?.container?.id;
      locationId = item?.location?.id;
    }

    setValue('from_container_id', containerId ?? '', { shouldValidate: false });
    setValue('from_location_id', locationId ?? '', { shouldValidate: false });
  };

  const onSubmit = (values: CreateMovementFormValues) => {
    const payload: CreateMovementRequest = {
      stored_item_id: values.stored_item_id,
      movement_type: values.movement_type,
      performed_by_id: values.performed_by_id || undefined,
      to_container_id: values.to_container_id || undefined,
      to_location_id: values.to_location_id || undefined,
      from_container_id: values.from_container_id || undefined,
      from_location_id: values.from_location_id || undefined,
      reason: values.reason || undefined,
      notes: values.notes || undefined,
      quantity: values.quantity,
      expected_return_date:
        values.movement_type === 'OUT' && values.expected_return_date
          ? values.expected_return_date
          : undefined,
    };

    createMovement.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Mouvement enregistré avec succès' });
        reset();
        setItemCategory('');
        onOpenChange(false);
      },
      onError: () =>
        toast({ variant: 'error', title: "Erreur lors de l'enregistrement du mouvement" }),
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) { reset(); setItemCategory(''); }
        onOpenChange(v);
      }}
      title="Enregistrer un mouvement"
      description="Enregistrer un déplacement physique d'un article"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Item picker */}
        <Select
          label="Catégorie d'article"
          required
          options={ITEM_CATEGORY_OPTIONS}
          value={itemCategory}
          onValueChange={handleCategoryChange}
          placeholder="Sélectionner une catégorie"
        />
        <Controller
          control={control}
          name="stored_item_id"
          render={({ field }) => (
            <Select
              label="Article"
              required
              options={itemOptions}
              value={field.value ?? ''}
              onValueChange={(v) => handleItemChange(v, field.onChange)}
              error={errors.stored_item_id?.message}
              placeholder={
                !itemCategory
                  ? "Sélectionner une catégorie d'abord"
                  : itemsLoading
                  ? 'Chargement...'
                  : itemOptions.length === 0
                  ? 'Aucun article disponible'
                  : 'Sélectionner un article'
              }
              disabled={!itemCategory || itemsLoading || itemOptions.length === 0}
            />
          )}
        />

        {/* Movement type */}
        <Controller
          control={control}
          name="movement_type"
          render={({ field }) => (
            <Select
              label="Type de mouvement"
              required
              options={MOVEMENT_TYPE_OPTIONS_CREATE}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.movement_type?.message}
              placeholder="Sélectionner un type"
            />
          )}
        />

        {/* Quantity */}
        <Input
          label="Quantité"
          type="number"
          min={1}
          defaultValue={1}
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        {/* Performer (optional, defaults to current user) */}
        <Controller
          control={control}
          name="performed_by_id"
          render={({ field }) => (
            <Select
              label="Effectué par (optionnel)"
              options={userOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.performed_by_id?.message}
              placeholder="— Utilisateur courant —"
            />
          )}
        />

        {/* From / To containers */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="from_container_id"
            render={({ field }) => (
              <Select
                label={fromContainerId ? 'Conteneur source (auto)' : 'Conteneur source'}
                options={containerOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.from_container_id?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="to_container_id"
            render={({ field }) => (
              <Select
                label="Conteneur destination"
                options={containerOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.to_container_id?.message}
              />
            )}
          />
        </div>

        {/* From / To locations */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="from_location_id"
            render={({ field }) => (
              <Select
                label={fromLocationId ? 'Emplacement source (auto)' : 'Emplacement source'}
                options={locationOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.from_location_id?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="to_location_id"
            render={({ field }) => (
              <Select
                label="Emplacement destination"
                options={locationOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.to_location_id?.message}
              />
            )}
          />
        </div>

        {/* Expected return date — only for OUT */}
        {movementType === 'OUT' && (
          <Input
            label="Date de retour prévue"
            type="date"
            {...register('expected_return_date')}
          />
        )}

        {/* Reason */}
        <Input
          label="Motif (optionnel)"
          placeholder="Raison du mouvement..."
          error={errors.reason?.message}
          {...register('reason')}
        />

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
          <textarea
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:border-gray-400 transition-colors min-h-20 resize-y"
            placeholder="Informations complémentaires..."
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { reset(); setItemCategory(''); onOpenChange(false); }}
          >
            Annuler
          </Button>
          <Button type="submit" loading={createMovement.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovementsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<MovementFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: movementsData, isLoading } = useMovements(filters);
  const { data: overdueMovements } = useOverdueMovements();
  const recordReturn = useRecordReturn();

  const handleRecordReturn = (id: string) => {
    recordReturn.mutate(id, {
      onSuccess: () => toast({ variant: 'success', title: 'Retour enregistré avec succès' }),
      onError: () => toast({ variant: 'error', title: "Erreur lors de l'enregistrement du retour" }),
    });
  };

  const columns: Column<FullMovement>[] = [
    {
      key: 'movement_type',
      header: 'Type',
      render: (m) => (
        <Badge variant={MOVEMENT_TYPE_VARIANTS[m.movement_type]}>
          {MOVEMENT_TYPE_LABELS[m.movement_type]}
        </Badge>
      ),
    },
    {
      key: 'stored_item',
      header: 'Article',
      render: (m) =>
        m.stored_item ? (
          <div>
            <p className="text-sm text-gray-900 font-medium">{m.stored_item.description ?? '—'}</p>
            <p className="text-xs text-gray-500">{m.stored_item.item_type}</p>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'from',
      header: 'Depuis',
      render: (m) => {
        const parts = [m.from_location?.name, m.from_container?.name].filter(Boolean);
        return parts.length > 0 ? (
          <span className="text-sm text-gray-700">{parts.join(' / ')}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      key: 'to',
      header: 'Vers',
      render: (m) => {
        const parts = [m.to_location?.name, m.to_container?.name].filter(Boolean);
        return parts.length > 0 ? (
          <span className="text-sm text-gray-700">{parts.join(' / ')}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      key: 'performed_by',
      header: 'Effectué par',
      render: (m) =>
        m.performed_by ? (
          <span className="text-sm text-gray-700">{m.performed_by.name}</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'movement_date',
      header: 'Date mouvement',
      sortable: true,
      render: (m) => <span className="text-sm text-gray-700">{formatDateTime(m.movement_date)}</span>,
    },
    {
      key: 'expected_return_date',
      header: 'Retour prévu',
      render: (m) => {
        if (!m.expected_return_date) return <span className="text-gray-400">-</span>;
        const overdue = m.is_return_overdue ?? (new Date(m.expected_return_date) < new Date() && !m.actual_return_date);
        return (
          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
            {formatDate(m.expected_return_date)}
          </span>
        );
      },
    },
    {
      key: 'actual_return_date',
      header: 'Retour effectif',
      render: (m) =>
        m.actual_return_date ? (
          <Badge variant="success">{formatDate(m.actual_return_date)}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => {
        const canReturn = m.movement_type === 'OUT' && !m.actual_return_date;
        if (!canReturn) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleRecordReturn(m.id);
            }}
            loading={recordReturn.isPending}
          >
            Retour
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mouvements"
        description="Suivi des mouvements physiques d'articles"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Enregistrer un mouvement
          </Button>
        }
      />

      {/* Overdue alert */}
      {overdueMovements && overdueMovements.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <h2 className="text-base font-semibold text-orange-800">
                {overdueMovements.length} retour{overdueMovements.length > 1 ? 's' : ''} en retard
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueMovements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.stored_item?.description ?? 'Article inconnu'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Effectué par : {m.performed_by?.name ?? '—'}
                    </p>
                    {m.expected_return_date && (
                      <p className="text-xs text-red-600 mt-0.5">
                        Retour prévu le {formatDate(m.expected_return_date)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecordReturn(m.id)}
                    loading={recordReturn.isPending}
                  >
                    Enregistrer le retour
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Type de mouvement"
              options={MOVEMENT_TYPE_OPTIONS_ALL}
              value={filters.movement_type ?? ''}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  movement_type: (v || undefined) as BackendMovementType | undefined,
                }))
              }
              placeholder="Tous les types"
            />
            <Input
              label="Date début"
              type="date"
              value={filters.from_date ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, from_date: e.target.value || undefined }))
              }
            />
            <Input
              label="Date fin"
              type="date"
              value={filters.to_date ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to_date: e.target.value || undefined }))
              }
            />
            <Input
              label="ID Article (optionnel)"
              placeholder="UUID de l'article..."
              value={filters.stored_item_id ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  stored_item_id: e.target.value || undefined,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Historique des mouvements</h2>
          </div>
        </CardHeader>
        <DataTable
          columns={columns}
          data={movementsData?.items ?? []}
          loading={isLoading}
          pagination={movementsData?.pagination}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          rowKey={(m) => m.id}
          onRowClick={(m) => navigate(`/movements/${m.id}`)}
          emptyTitle="Aucun mouvement"
          emptyDescription="Aucun mouvement ne correspond aux filtres sélectionnés"
        />
      </Card>

      <CreateMovementModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
