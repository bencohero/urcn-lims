import { useState } from 'react';
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
  { value: 'INTERNAL_TRANSFER', label: 'Transfert interne' },
  { value: 'OUTGOING', label: 'Sortie' },
  { value: 'INCOMING', label: 'Entree' },
  { value: 'ADJUSTMENT', label: 'Ajustement' },
];

const MOVEMENT_TYPE_OPTIONS_CREATE = [
  { value: 'INTERNAL_TRANSFER', label: 'Transfert interne' },
  { value: 'OUTGOING', label: 'Sortie' },
  { value: 'INCOMING', label: 'Entree' },
  { value: 'ADJUSTMENT', label: 'Ajustement' },
];

type MovementBadgeVariant = 'danger' | 'success' | 'info' | 'warning';

const MOVEMENT_TYPE_VARIANTS: Record<BackendMovementType, MovementBadgeVariant> = {
  OUTGOING: 'danger',
  INCOMING: 'success',
  INTERNAL_TRANSFER: 'info',
  ADJUSTMENT: 'warning',
};

const MOVEMENT_TYPE_LABELS: Record<BackendMovementType, string> = {
  OUTGOING: 'Sortie',
  INCOMING: 'Entree',
  INTERNAL_TRANSFER: 'Transfert interne',
  ADJUSTMENT: 'Ajustement',
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createMovementSchema = z.object({
  stored_item_id: z.string().uuid('UUID article invalide'),
  movement_type: z.enum(['INTERNAL_TRANSFER', 'OUTGOING', 'INCOMING', 'ADJUSTMENT'], {
    required_error: 'Type requis',
  }),
  performed_by: z.string().uuid('UUID utilisateur invalide'),
  to_container_id: z
    .string()
    .uuid('UUID invalide')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  to_location_id: z
    .string()
    .uuid('UUID invalide')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  from_container_id: z
    .string()
    .uuid('UUID invalide')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z.string().optional(),
  expected_return_date: z.string().optional(),
});

type CreateMovementFormValues = z.infer<typeof createMovementSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function isOverdue(date?: string): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

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
  const { data: usersData } = useUsers({ page_size: 100 });
  const { data: containersData } = useContainers({ page_size: 100 });
  const { data: locationsData } = useStorageLocations({ page_size: 100 });

  const userOptions = (usersData?.items ?? []).map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name} (${u.username})`,
  }));
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
    formState: { errors },
  } = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementSchema),
  });

  const movementType = watch('movement_type');

  const onSubmit = (values: CreateMovementFormValues) => {
    const payload: CreateMovementRequest = {
      stored_item_id: values.stored_item_id,
      movement_type: values.movement_type,
      performed_by: values.performed_by,
      to_container_id: values.to_container_id || undefined,
      to_location_id: values.to_location_id || undefined,
      from_container_id: values.from_container_id || undefined,
      notes: values.notes || undefined,
      expected_return_date:
        values.movement_type === 'OUTGOING' && values.expected_return_date
          ? values.expected_return_date
          : undefined,
    };

    createMovement.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Mouvement enregistre avec succes' });
        reset();
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
        if (!v) reset();
        onOpenChange(v);
      }}
      title="Enregistrer un mouvement"
      description="Enregistrer un deplacement physique d'un article"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="ID Article (UUID)"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          error={errors.stored_item_id?.message}
          {...register('stored_item_id')}
        />
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
              placeholder="Selectionner un type"
            />
          )}
        />
        <Controller
          control={control}
          name="performed_by"
          render={({ field }) => (
            <Select
              label="Effectue par"
              required
              options={userOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.performed_by?.message}
              placeholder="Selectionner un utilisateur"
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="from_container_id"
            render={({ field }) => (
              <Select
                label="Conteneur source (optionnel)"
                options={containerOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.from_container_id?.message}
                placeholder="— Aucun —"
              />
            )}
          />
          <Controller
            control={control}
            name="to_container_id"
            render={({ field }) => (
              <Select
                label="Conteneur destination (optionnel)"
                options={containerOptions}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                error={errors.to_container_id?.message}
                placeholder="— Aucun —"
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="to_location_id"
          render={({ field }) => (
            <Select
              label="Emplacement destination (optionnel)"
              options={locationOptions}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              error={errors.to_location_id?.message}
              placeholder="— Aucun —"
            />
          )}
        />
        {movementType === 'OUTGOING' && (
          <Input
            label="Date de retour prevue"
            type="date"
            {...register('expected_return_date')}
          />
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
          <textarea
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:border-gray-400 transition-colors min-h-20 resize-y"
            placeholder="Informations complementaires..."
            {...register('notes')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
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
  const { toast } = useToast();
  const [filters, setFilters] = useState<MovementFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: movementsData, isLoading } = useMovements(filters);
  const { data: overdueMovements } = useOverdueMovements();
  const recordReturn = useRecordReturn();

  const handleRecordReturn = (id: string) => {
    recordReturn.mutate(id, {
      onSuccess: () => toast({ variant: 'success', title: 'Retour enregistre avec succes' }),
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
            <p className="text-sm text-gray-900 font-medium">{m.stored_item.description}</p>
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
      header: 'Effectue par',
      render: (m) =>
        m.performed_by ? (
          <span className="text-sm text-gray-700">{m.performed_by.full_name}</span>
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
      header: 'Retour prevu',
      render: (m) => {
        if (!m.expected_return_date) return <span className="text-gray-400">-</span>;
        const overdue = isOverdue(m.expected_return_date) && !m.return_date;
        return (
          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
            {formatDate(m.expected_return_date)}
          </span>
        );
      },
    },
    {
      key: 'return_date',
      header: 'Retour effectif',
      render: (m) =>
        m.return_date ? (
          <Badge variant="success">Retourne</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => {
        const canReturn = m.movement_type === 'OUTGOING' && !m.return_date;
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
                    {m.expected_return_date && (
                      <p className="text-xs text-red-600 mt-0.5">
                        Retour prevu le {formatDate(m.expected_return_date)}
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
              label="Date debut"
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
          emptyTitle="Aucun mouvement"
          emptyDescription="Aucun mouvement ne correspond aux filtres selectionnes"
        />
      </Card>

      {/* Create modal */}
      <CreateMovementModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
