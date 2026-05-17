import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, BookOpen } from 'lucide-react';
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
import { useStudies, useCreateStudy } from '@/hooks/useStudies';
import { formatDate } from '@/lib/utils/utils';
import type { Study, StudyFilters } from '@/types';
import type { CreateStudyRequest } from '@/lib/api/studies';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'PAUSED', label: 'Pause' },
  { value: 'COMPLETED', label: 'Terminee' },
  { value: 'TERMINATED', label: 'Arretee' },
];

const PHASE_OPTIONS = [
  { value: 'Phase I', label: 'Phase I' },
  { value: 'Phase II', label: 'Phase II' },
  { value: 'Phase III', label: 'Phase III' },
  { value: 'Phase IV', label: 'Phase IV' },
];

const STATUS_CREATE_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'PAUSED', label: 'Pause' },
  { value: 'COMPLETED', label: 'Terminee' },
  { value: 'TERMINATED', label: 'Arretee' },
];

const createStudySchema = z.object({
  protocol_number: z.string().min(1, 'Le numero de protocole est requis'),
  title: z.string().min(1, 'Le titre est requis'),
  sponsor: z.string().min(1, 'Le promoteur est requis'),
  phase: z.enum(['Phase I', 'Phase II', 'Phase III', 'Phase IV'], {
    required_error: 'La phase est requise',
  }),
  therapeutic_area: z.string().min(1, 'Le domaine therapeutique est requis'),
  start_date: z.string().min(1, 'La date de debut est requise'),
  end_date: z.string().min(1, 'La date de fin est requise'),
  estimated_enrollment: z.coerce.number().int().positive('Le nombre de participants doit etre positif'),
  retention_period_years: z.coerce.number().int().positive('La duree de retention doit etre positive'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED']).default('ACTIVE'),
});

type CreateStudyFormValues = z.infer<typeof createStudySchema>;

const columns: Column<Study>[] = [
  {
    key: 'protocol_number',
    header: 'Protocole',
    sortable: true,
    render: (study) => (
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-900">{study.protocol_number}</span>
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Titre',
    render: (study) => (
      <span className="block max-w-xs truncate text-sm text-gray-700" title={study.title}>
        {study.title}
      </span>
    ),
  },
  {
    key: 'sponsor',
    header: 'Promoteur',
    render: (study) => <span className="text-sm text-gray-700">{study.sponsor}</span>,
  },
  {
    key: 'phase',
    header: 'Phase',
    sortable: true,
    render: (study) => <Badge variant="primary">{study.phase}</Badge>,
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (study) => <StatusBadge status={study.status} />,
  },
  {
    key: 'sites_count',
    header: 'Sites',
    render: (study) => (
      <span className="text-sm text-gray-700">{study.sites_count ?? '-'}</span>
    ),
  },
  {
    key: 'start_date',
    header: 'Debut / Fin',
    sortable: true,
    render: (study) => (
      <div>
        <p className="text-sm text-gray-900">{study.start_date ? formatDate(study.start_date) : '-'}</p>
        <p className="text-xs text-gray-500">{study.end_date ? formatDate(study.end_date) : '-'}</p>
      </div>
    ),
  },
  {
    key: 'created_at',
    header: 'Cree le',
    sortable: true,
    render: (study) => <span className="text-sm text-gray-500">{formatDate(study.created_at)}</span>,
  },
];

function CreateStudyForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (data: CreateStudyRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateStudyFormValues>({
    resolver: zodResolver(createStudySchema),
    defaultValues: { status: 'ACTIVE' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Numero de protocole"
          placeholder="EX-2024-001"
          error={errors.protocol_number?.message}
          {...register('protocol_number')}
        />
        <Input
          label="Titre"
          placeholder="Titre de l'etude"
          error={errors.title?.message}
          {...register('title')}
        />
        <Input
          label="Promoteur"
          placeholder="Nom du promoteur"
          error={errors.sponsor?.message}
          {...register('sponsor')}
        />
        <Controller
          control={control}
          name="phase"
          render={({ field }) => (
            <Select
              label="Phase"
              options={PHASE_OPTIONS}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="Selectionner une phase"
              error={errors.phase?.message}
            />
          )}
        />
        <Input
          label="Domaine therapeutique"
          placeholder="Ex: Oncologie"
          error={errors.therapeutic_area?.message}
          {...register('therapeutic_area')}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Statut"
              options={STATUS_CREATE_OPTIONS}
              value={field.value ?? 'ACTIVE'}
              onValueChange={field.onChange}
              placeholder="Statut"
              error={errors.status?.message}
            />
          )}
        />
        <Input
          label="Date de debut"
          type="date"
          error={errors.start_date?.message}
          {...register('start_date')}
        />
        <Input
          label="Date de fin"
          type="date"
          error={errors.end_date?.message}
          {...register('end_date')}
        />
        <Input
          label="Participants estimes"
          type="number"
          placeholder="100"
          error={errors.estimated_enrollment?.message}
          {...register('estimated_enrollment')}
        />
        <Input
          label="Retention (annees)"
          type="number"
          placeholder="10"
          error={errors.retention_period_years?.message}
          {...register('retention_period_years')}
        />
      </div>
      <Input
        label="Description (optionnel)"
        placeholder="Description de l'etude"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Creer l'etude
        </Button>
      </div>
    </form>
  );
}

export default function StudiesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<StudyFilters>({ page: 1, page_size: 25 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useStudies(filters);
  const createStudy = useCreateStudy();

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = (payload: CreateStudyRequest) => {
    createStudy.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Etude creee avec succes' });
        setShowCreateModal(false);
      },
      onError: () => toast({ variant: 'error', title: "Erreur lors de la creation de l'etude" }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etudes"
        description="Gestion des etudes cliniques"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nouvelle etude
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Rechercher par protocole, titre, promoteur..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
            />
            <Select
              options={STATUS_OPTIONS}
              value={filters.status || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (val || undefined) as StudyFilters['status'],
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
          onRowClick={(study) => navigate(`/studies/${study.id}`)}
          rowKey={(study) => study.id}
          emptyTitle="Aucune etude"
          emptyDescription="Aucune etude ne correspond aux filtres"
          emptyAction={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Creer une etude
            </Button>
          }
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nouvelle etude"
        description="Ajoutez une nouvelle etude clinique au systeme"
      >
        <CreateStudyForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createStudy.isPending}
        />
      </Modal>
    </div>
  );
}
