import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, MapPin } from 'lucide-react';
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
import { useSites, useCreateSite } from '@/hooks/useSites';
import { useStudies } from '@/hooks/useStudies';
import { formatDate } from '@/lib/utils/utils';
import type { Site, SiteFilters } from '@/types';
import type { CreateSiteRequest } from '@/lib/api/sites';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'CLOSED', label: 'Ferme' },
];

const createSiteSchema = z.object({
  study_id: z.string().uuid('Identifiant etude invalide'),
  site_number: z.string().min(1, 'Le numero de site est requis'),
  name: z.string().min(1, 'Le nom est requis'),
  country: z.string().min(1, 'Le pays est requis'),
  city: z.string().min(1, 'La ville est requise'),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  has_offline_capability: z.boolean().default(false),
  activation_date: z.string().optional().or(z.literal('')),
  principal_investigator_name: z.string().optional().or(z.literal('')),
  principal_investigator_email: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
});

type CreateSiteFormValues = z.infer<typeof createSiteSchema>;

const columns: Column<Site>[] = [
  {
    key: 'site_number',
    header: 'N° Site',
    sortable: true,
    render: (site) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-900">{site.site_number}</span>
      </div>
    ),
  },
  {
    key: 'name',
    header: 'Nom',
    sortable: true,
    render: (site) => <span className="text-sm text-gray-700">{site.name}</span>,
  },
  {
    key: 'country',
    header: 'Pays / Ville',
    render: (site) => (
      <div>
        <p className="text-sm text-gray-900">{site.country}</p>
        <p className="text-xs text-gray-500">{site.city}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (site) => <StatusBadge status={site.status} />,
  },
  {
    key: 'principal_investigator',
    header: 'Investigateur principal',
    render: (site) => (
      <span className="text-sm text-gray-700">
        {site.principal_investigator?.name ?? '-'}
      </span>
    ),
  },
  {
    key: 'total_items_stored',
    header: 'Articles stockes',
    render: (site) => (
      <Badge variant="default">{site.total_items_stored ?? 0}</Badge>
    ),
  },
  {
    key: 'activation_date',
    header: 'Date activation',
    sortable: true,
    render: (site) => (
      <span className="text-sm text-gray-500">
        {site.activation_date ? formatDate(site.activation_date) : '-'}
      </span>
    ),
  },
];

function CreateSiteForm({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (data: CreateSiteRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSiteFormValues>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: { has_offline_capability: false },
  });

  const { data: studiesData } = useStudies({ page_size: 100 });
  const studyOptions = (studiesData?.items ?? []).map((s) => ({
    value: s.id,
    label: `${s.protocol_number} — ${s.title}`,
  }));

  const handleFormSubmit = (data: CreateSiteFormValues) => {
    const payload: CreateSiteRequest = {
      study_id: data.study_id,
      site_number: data.site_number,
      name: data.name,
      country: data.country,
      city: data.city,
      has_offline_capability: data.has_offline_capability,
    };
    if (data.address) payload.address = data.address;
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;
    if (data.activation_date) payload.activation_date = data.activation_date;
    if (data.principal_investigator_name) {
      payload.principal_investigator = {
        name: data.principal_investigator_name,
        ...(data.principal_investigator_email
          ? { email: data.principal_investigator_email }
          : {}),
      };
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Etude"
          options={studyOptions}
          value={watch('study_id') || ''}
          onValueChange={(val) => setValue('study_id', val, { shouldValidate: true })}
          error={errors.study_id?.message}
          placeholder="Sélectionner une étude..."
          required
        />
        <Input
          label="Numero de site"
          placeholder="SITE-001"
          error={errors.site_number?.message}
          {...register('site_number')}
        />
        <div className="sm:col-span-2">
          <Input
            label="Nom du site"
            placeholder="Nom du site"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <Input
          label="Pays"
          placeholder="France"
          error={errors.country?.message}
          {...register('country')}
        />
        <Input
          label="Ville"
          placeholder="Paris"
          error={errors.city?.message}
          {...register('city')}
        />
        <div className="sm:col-span-2">
          <Input
            label="Adresse (optionnel)"
            placeholder="Adresse complete"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>
        <Input
          label="Telephone (optionnel)"
          placeholder="+33 1 23 45 67 89"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email (optionnel)"
          type="email"
          placeholder="contact@site.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Date d'activation (optionnel)"
          type="date"
          error={errors.activation_date?.message}
          {...register('activation_date')}
        />
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="has_offline_capability"
            render={({ field }) => (
              <input
                id="has_offline_capability"
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
          />
          <label htmlFor="has_offline_capability" className="text-sm text-gray-700">
            Capacite hors ligne
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Investigateur principal (optionnel)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            placeholder="Nom de l'investigateur"
            error={errors.principal_investigator_name?.message}
            {...register('principal_investigator_name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="investigateur@hopital.com"
            error={errors.principal_investigator_email?.message}
            {...register('principal_investigator_email')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Creer le site
        </Button>
      </div>
    </form>
  );
}

export default function SitesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<SiteFilters>({ page: 1, page_size: 25 });
  const [countrySearch, setCountrySearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useSites({
    ...filters,
    ...(countrySearch ? { country: countrySearch } : {}),
  });
  const createSite = useCreateSite();

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCreate = (payload: CreateSiteRequest) => {
    createSite.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Site cree avec succes' });
        setShowCreateModal(false);
      },
      onError: () => toast({ variant: 'error', title: 'Erreur lors de la creation du site' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites"
        description="Gestion des sites d'etude"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nouveau site
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Rechercher par nom, numero..."
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
                  status: (val || undefined) as SiteFilters['status'],
                  page: 1,
                }))
              }
              placeholder="Statut"
            />
            <Input
              placeholder="Filtrer par pays..."
              iconLeft={<Search className="h-4 w-4" />}
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
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
          onRowClick={(site) => navigate(`/sites/${site.id}`)}
          rowKey={(site) => site.id}
          emptyTitle="Aucun site"
          emptyDescription="Aucun site ne correspond aux filtres"
          emptyAction={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Nouveau site
            </Button>
          }
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nouveau site"
        description="Ajoutez un nouveau site d'etude au systeme"
      >
        <CreateSiteForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createSite.isPending}
        />
      </Modal>
    </div>
  );
}
