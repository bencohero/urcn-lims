import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useStudies } from '@/hooks/useStudies';
import { useSites } from '@/hooks/useSites';
import { useStorageLocations, useContainersByLocation } from '@/hooks/useStorage';
import type { CreateDocumentRequest } from '@/types';

const documentSchema = z.object({
  study_id: z.string().min(1, 'Etude requise'),
  site_id: z.string().min(1, 'Site requis'),
  container_id: z.string().optional(),
  document_type: z.string().min(1, 'Type requis'),
  subject_id: z.string().optional(),
  visit_number: z.string().optional(),
  form_name: z.string().optional(),
  version: z.string().optional(),
  page_count: z.coerce.number().min(1).optional().or(z.literal(NaN).transform(() => undefined)),
  signature_required: z.boolean().default(false),
  signed_date: z.string().optional(),
  confidentiality_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  storage_date: z.string().min(1, 'Date de stockage requise'),
  expected_retention_until: z.string().optional(),
  description: z.string().optional(),
  internal_code: z.string().optional(),
  physical_condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).optional(),
  location_notes: z.string().optional(),
  retention_category: z.string().optional(),
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
  { value: 'LAB_REPORT', label: 'Rapport laboratoire' },
  { value: 'OTHER', label: 'Autre' },
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Elevee' },
  { value: 'CRITICAL', label: 'Critique' },
];

const PHYSICAL_CONDITIONS = [
  { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' },
  { value: 'DAMAGED', label: 'Endommage' },
];

export function DocumentForm({ onSubmit, onCancel, loading, defaultValues }: DocumentFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      signature_required: false,
      confidentiality_level: 'HIGH',
      physical_condition: 'GOOD',
      storage_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const selectedStudyId = watch('study_id');
  const selectedSiteId = watch('site_id');
  const signatureRequired = watch('signature_required');

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
    const payload: CreateDocumentRequest = {
      study_id: data.study_id,
      site_id: data.site_id,
      container_id: data.container_id || undefined,
      document_type: data.document_type,
      subject_id: data.subject_id || undefined,
      visit_number: data.visit_number || undefined,
      form_name: data.form_name || undefined,
      version: data.version || undefined,
      page_count: data.page_count ?? undefined,
      signature_required: data.signature_required,
      signed_date: data.signed_date || undefined,
      confidentiality_level: data.confidentiality_level,
      storage_date: data.storage_date,
      expected_retention_until: data.expected_retention_until || undefined,
      description: data.description || undefined,
      internal_code: data.internal_code || undefined,
      physical_condition: data.physical_condition,
      location_notes: data.location_notes || undefined,
      retention_category: data.retention_category || undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Identification */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-gray-900">Identification</legend>
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
            placeholder="Selectionner une etude..."
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
            placeholder={selectedStudyId ? 'Selectionner un site...' : "Choisir d'abord une etude"}
            disabled={!selectedStudyId}
            required
          />
          <Select
            label="Type de document"
            options={DOCUMENT_TYPES}
            value={watch('document_type') || ''}
            onValueChange={(val) => setValue('document_type', val)}
            error={errors.document_type?.message}
            required
          />
          <Input
            label="ID Sujet"
            placeholder="Ex: SUBJ-001"
            {...register('subject_id')}
          />
        </div>
      </fieldset>

      {/* Details du document */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-gray-900">Details du document</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Numero de visite"
            placeholder="Ex: V1"
            {...register('visit_number')}
          />
          <Input
            label="Nom du formulaire"
            placeholder="Ex: Formulaire de consentement"
            {...register('form_name')}
          />
          <Input
            label="Version"
            placeholder="Ex: 1.0"
            {...register('version')}
          />
          <Input
            label="Nombre de pages"
            type="number"
            min={1}
            error={errors.page_count?.message}
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
          <Input
            label="Categorie de retention"
            placeholder="Ex: Essentiel"
            {...register('retention_category')}
          />
        </div>
        <div className="mt-4 space-y-3">
          <Controller
            name="signature_required"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="Signature requise"
                description="Ce document necessite une signature du sujet ou de l'investigateur"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          {signatureRequired && (
            <Input
              label="Date de signature"
              type="date"
              error={errors.signed_date?.message}
              {...register('signed_date')}
            />
          )}
        </div>
      </fieldset>

      {/* Stockage */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-gray-900">Stockage</legend>
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
            {...register('expected_retention_until')}
          />
          <Input
            label="Notes d'emplacement"
            placeholder="Ex: Etagere 3, boite rouge"
            {...register('location_notes')}
          />
        </div>
      </fieldset>

      {/* Description */}
      <Input
        label="Description"
        placeholder="Description optionnelle..."
        {...register('description')}
      />

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
