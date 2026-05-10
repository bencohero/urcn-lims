import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Edit2,
  BookOpen,
  BarChart2,
  MapPin,
  FileText,
  Microscope,
  Package,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useStudyById, useUpdateStudy } from '@/hooks/useStudies';
import { formatDate } from '@/lib/utils/utils';
import type { Site } from '@/types';
import type { UpdateStudyRequest } from '@/lib/api/studies';

const PHASE_OPTIONS = [
  { value: 'Phase I', label: 'Phase I' },
  { value: 'Phase II', label: 'Phase II' },
  { value: 'Phase III', label: 'Phase III' },
  { value: 'Phase IV', label: 'Phase IV' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'PAUSED', label: 'Pause' },
  { value: 'COMPLETED', label: 'Terminee' },
  { value: 'TERMINATED', label: 'Arretee' },
];

const editStudySchema = z.object({
  title: z.string().min(1).optional().or(z.literal('')),
  sponsor: z.string().min(1).optional().or(z.literal('')),
  phase: z.enum(['Phase I', 'Phase II', 'Phase III', 'Phase IV']).optional(),
  therapeutic_area: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  estimated_enrollment: z.coerce.number().int().positive().optional(),
  retention_period_years: z.coerce.number().int().positive().optional(),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED', 'CANCELLED']).optional(),
});

type EditStudyFormValues = z.infer<typeof editStudySchema>;

function InfoItem({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function EditStudyForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: {
  defaultValues: EditStudyFormValues;
  onSubmit: (data: UpdateStudyRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditStudyFormValues>({
    resolver: zodResolver(editStudySchema),
    defaultValues,
  });

  const handleFormSubmit = (data: EditStudyFormValues) => {
    const payload: UpdateStudyRequest = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.sponsor !== undefined) payload.sponsor = data.sponsor;
    if (data.phase) payload.phase = data.phase;
    if (data.therapeutic_area !== undefined) payload.therapeutic_area = data.therapeutic_area;
    if (data.start_date !== undefined) payload.start_date = data.start_date;
    if (data.end_date !== undefined) payload.end_date = data.end_date;
    if (data.estimated_enrollment !== undefined) payload.estimated_enrollment = data.estimated_enrollment;
    if (data.retention_period_years !== undefined) payload.retention_period_years = data.retention_period_years;
    if (data.description !== undefined) payload.description = data.description;
    if (data.status) payload.status = data.status;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Statut"
              options={STATUS_OPTIONS}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="Statut"
              error={errors.status?.message}
            />
          )}
        />
        <Input
          label="Domaine therapeutique"
          placeholder="Ex: Oncologie"
          error={errors.therapeutic_area?.message}
          {...register('therapeutic_area')}
        />
        <Input
          label="Participants estimes"
          type="number"
          error={errors.estimated_enrollment?.message}
          {...register('estimated_enrollment')}
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
          label="Retention (annees)"
          type="number"
          error={errors.retention_period_years?.message}
          {...register('retention_period_years')}
        />
      </div>
      <Input
        label="Description"
        placeholder="Description de l'etude"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function SiteRow({ site, onClick }: { site: Site; onClick: () => void }) {
  return (
    <tr
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{site.site_number}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{site.name}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{site.country}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{site.city}</td>
      <td className="px-4 py-3">
        <StatusBadge status={site.status} />
      </td>
    </tr>
  );
}

export default function StudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: study, isLoading } = useStudyById(id!);
  const updateStudy = useUpdateStudy();

  const handleUpdate = (payload: UpdateStudyRequest) => {
    updateStudy.mutate(
      { id: id!, payload },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Etude mise a jour' });
          setShowEditModal(false);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la mise a jour' }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Etude introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/studies')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const stats = study.statistics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/studies')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={study.protocol_number}
        description={[study.title, study.sponsor].filter(Boolean).join(' — ')}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={study.status} />
            <Button
              variant="outline"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Modifier
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informations */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Informations
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Phase" value={study.phase} />
              <InfoItem label="Domaine therapeutique" value={study.therapeutic_area} />
              <InfoItem
                label="Participants estimes"
                value={study.estimated_enrollment?.toLocaleString('fr-FR')}
              />
              <InfoItem
                label="Retention"
                value={`${study.retention_period_years} an${study.retention_period_years > 1 ? 's' : ''}`}
              />
              <InfoItem label="Date de debut" value={study.start_date ? formatDate(study.start_date) : '-'} />
              <InfoItem label="Date de fin" value={study.end_date ? formatDate(study.end_date) : '-'} />
              {study.description && (
                <div className="col-span-2">
                  <InfoItem label="Description" value={study.description} />
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Statistiques
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <FileText className="mx-auto h-5 w-5 text-blue-500 mb-1" />
                <p className="text-2xl font-bold text-blue-700">
                  {stats?.total_documents ?? 0}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Documents</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-center">
                <Microscope className="mx-auto h-5 w-5 text-purple-500 mb-1" />
                <p className="text-2xl font-bold text-purple-700">
                  {stats?.total_equipment ?? 0}
                </p>
                <p className="text-xs text-purple-600 mt-0.5">Equipements</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <Package className="mx-auto h-5 w-5 text-green-500 mb-1" />
                <p className="text-2xl font-bold text-green-700">
                  {stats?.total_consumables ?? 0}
                </p>
                <p className="text-xs text-green-600 mt-0.5">Consommables</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <ClipboardList className="mx-auto h-5 w-5 text-orange-500 mb-1" />
                <p className="text-2xl font-bold text-orange-700">
                  {stats?.active_access_requests ?? 0}
                </p>
                <p className="text-xs text-orange-600 mt-0.5">Demandes actives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sites associes */}
        {study.sites && study.sites.length > 0 && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Sites associes
                  <Badge variant="default" className="ml-1">
                    {study.sites.length}
                  </Badge>
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Site
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pays
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ville
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {study.sites.map((site) => (
                        <SiteRow
                          key={site.id}
                          site={site}
                          onClick={() => navigate(`/sites/${site.id}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Modifier l'etude"
        description="Mettez a jour les informations de l'etude"
      >
        <EditStudyForm
          defaultValues={{
            title: study.title,
            sponsor: study.sponsor,
            phase: study.phase,
            therapeutic_area: study.therapeutic_area,
            start_date: study.start_date,
            end_date: study.end_date,
            estimated_enrollment: study.estimated_enrollment,
            retention_period_years: study.retention_period_years,
            description: study.description,
            status: study.status,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          loading={updateStudy.isPending}
        />
      </Modal>
    </div>
  );
}
