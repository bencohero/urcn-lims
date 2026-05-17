import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useStudies } from '@/hooks/useStudies';
import { useSites } from '@/hooks/useSites';
import { useStorageLocations, useContainersByLocation } from '@/hooks/useStorage';
import type { CreateDocumentRequest } from '@/types';


const documentSchema = z.object({
  study_id: z.string().min(1, 'Etude requise'),
  site_id: z.string().min(1, 'Site requis'),
  container_id: z.string().min(1, 'Conteneur requis'),
  document_type: z.enum(['CONSENT', 'CRF', 'SOURCE_DOC'], {
    required_error: 'Type requis',
  }),
  subject_id: z.string().min(1, 'ID sujet requis'),
  visit_number: z.string().min(1, 'Numero de visite requis'),
  form_name: z.string().min(1, 'Nom du formulaire requis'),
  version: z.string().min(1, 'Version requise'),
  page_count: z.coerce.number().min(1, 'Nombre de pages requis'),
  signature_required: z.boolean(),
  confidentiality_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  storage_date: z.string().min(1, 'Date de stockage requise'),
  expected_retention_until: z.string().min(1, 'Date de retention requise'),
  description: z.string().optional(),
  internal_code: z.string().optional(),
  physical_condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
  location_notes: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  onSubmit: (data: CreateDocumentRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<DocumentFormValues>;
}

const DOCUMENT_TYPES = [
  { value: 'CONSENT', label: 'Consentement' },
  { value: 'CRF', label: 'CRF' },
  { value: 'SOURCE_DOC', label: 'Document source' },
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
];

const PHYSICAL_CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' },
  { value: 'POOR', label: 'Mauvais' },
  { value: 'DAMAGED', label: 'Endommage' },
];

export function DocumentForm({ onSubmit, onCancel, loading, defaultValues }: DocumentFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      signature_required: false,
      confidentiality_level: 'MEDIUM',
      storage_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const selectedStudyId = watch('study_id');
  const selectedSiteId = watch('site_id');

  const { data: studiesData } = useStudies({ page_size: 100 });
  const studyOptions = (studiesData?.items ?? []).map((s) => ({
    value: s.id,
    label: `${s.protocol_number} — ${s.title}`,
  }));

  const { data: sitesData } = useSites({
    study_id: selectedStudyId || undefined,
    page_size: 100,
  });
  const siteOptions = (sitesData?.items ?? []).map((s) => ({
    value: s.id,
    label: `${s.site_number} — ${s.name}`,
  }));

  const { data: locationsData } = useStorageLocations({
    site_id: selectedSiteId || undefined,
    page_size: 100,
  });
  const locationOptions = (locationsData?.items ?? []).map((l) => ({
    value: l.id,
    label: l.code ? `${l.code} – ${l.name}` : l.name,
  }));

  const { data: containersData } = useContainersByLocation(selectedLocationId || undefined);
  const containerOptions = (containersData?.items ?? []).map((c) => ({
    value: c.id,
    label: c.code ? `${c.code} – ${c.name}` : c.name,
  }));

  const handleFormSubmit = (data: DocumentFormValues) => {
    onSubmit(data as CreateDocumentRequest);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identification */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Identification</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Etude"
            options={studyOptions}
            value={watch('study_id') || ''}
            onValueChange={(val) => {
              setValue('study_id', val, { shouldValidate: true });
              setValue('site_id', '');
              setSelectedLocationId('');
              setValue('container_id', '');
            }}
            error={errors.study_id?.message}
            placeholder="Sélectionner une étude..."
            required
          />
          <Select
            label="Site"
            options={siteOptions}
            value={watch('site_id') || ''}
            onValueChange={(val) => {
              setValue('site_id', val, { shouldValidate: true });
              setSelectedLocationId('');
              setValue('container_id', '');
            }}
            error={errors.site_id?.message}
            placeholder={selectedStudyId ? 'Sélectionner un site...' : "Choisir d'abord une étude"}
            disabled={!selectedStudyId}
            required
          />
          <Select
            label="Type de document"
            options={DOCUMENT_TYPES}
            value={watch('document_type')}
            onValueChange={(val) => setValue('document_type', val as DocumentFormValues['document_type'])}
            error={errors.document_type?.message}
            required
          />
          <Input
            label="ID Sujet"
            placeholder="Ex: SUBJ-001"
            error={errors.subject_id?.message}
            required
            {...register('subject_id')}
          />
        </div>
      </fieldset>

      {/* Details */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Details du document</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Numero de visite"
            placeholder="Ex: V1"
            error={errors.visit_number?.message}
            required
            {...register('visit_number')}
          />
          <Input
            label="Nom du formulaire"
            placeholder="Ex: Formulaire de consentement"
            error={errors.form_name?.message}
            required
            {...register('form_name')}
          />
          <Input
            label="Version"
            placeholder="Ex: 1.0"
            error={errors.version?.message}
            required
            {...register('version')}
          />
          <Input
            label="Nombre de pages"
            type="number"
            min={1}
            error={errors.page_count?.message}
            required
            {...register('page_count')}
          />
          <Select
            label="Confidentialite"
            options={CONFIDENTIALITY_LEVELS}
            value={watch('confidentiality_level')}
            onValueChange={(val) => setValue('confidentiality_level', val as DocumentFormValues['confidentiality_level'])}
            error={errors.confidentiality_level?.message}
            required
          />
          <Select
            label="Etat physique"
            options={PHYSICAL_CONDITIONS}
            value={watch('physical_condition') || ''}
            onValueChange={(val) => setValue('physical_condition', val as DocumentFormValues['physical_condition'])}
            placeholder="Selectionner..."
          />
        </div>
      </fieldset>

      {/* Stockage */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Stockage</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Emplacement"
            options={locationOptions}
            value={selectedLocationId}
            onValueChange={(val) => {
              setSelectedLocationId(val);
              setValue('container_id', '');
            }}
            placeholder={selectedSiteId ? 'Selectionner un emplacement...' : "Choisir d'abord un site"}
            disabled={!selectedSiteId}
          />
          <Select
            label="Conteneur"
            options={containerOptions}
            value={watch('container_id') || ''}
            onValueChange={(val) => setValue('container_id', val, { shouldValidate: true })}
            error={errors.container_id?.message}
            placeholder={selectedLocationId ? 'Selectionner un conteneur...' : "Choisir d'abord un emplacement"}
            disabled={!selectedLocationId}
            required
          />
          <Input
            label="Code interne"
            placeholder="Ex: DOC-2026-001"
            {...register('internal_code')}
          />
          <Input
            label="Date de stockage"
            type="date"
            error={errors.storage_date?.message}
            required
            {...register('storage_date')}
          />
          <Input
            label="Retention jusqu'au"
            type="date"
            error={errors.expected_retention_until?.message}
            required
            {...register('expected_retention_until')}
          />
        </div>
      </fieldset>

      {/* Description */}
      <Input
        label="Description"
        placeholder="Description optionnelle..."
        {...register('description')}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
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
