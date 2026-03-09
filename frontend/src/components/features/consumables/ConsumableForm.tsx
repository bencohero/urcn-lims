import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useStudies } from '@/hooks/useStudies';
import { useSites } from '@/hooks/useSites';
import { useStorageLocations, useContainersByLocation } from '@/hooks/useStorage';
import type { CreateConsumableRequest } from '@/types';

const schema = z.object({
  consumable_type: z.string().min(1, 'Type requis'),
  manufacturer: z.string().min(1, 'Fabricant requis'),
  catalog_number: z.string().min(1, 'Reference catalogue requise'),
  lot_number: z.string().min(1, 'Numero de lot requis'),
  quantity: z.number().int().positive('Quantite requise'),
  unit: z.string().min(1, 'Unite requise'),
  expiry_date: z.string().min(1, "Date d'expiration requise"),
  study_id: z.string().uuid('Etude requise'),
  site_id: z.string().uuid('Site requis'),
  container_id: z.string().uuid('Conteneur requis'),
  storage_date: z.string().min(1, 'Date de stockage requise'),
  hazardous: z.boolean().optional(),
  hazard_classification: z.string().optional(),
  storage_conditions: z.string().optional(),
  internal_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const CONSUMABLE_TYPES = [
  { value: 'REAGENT', label: 'Reactif' },
  { value: 'TUBE', label: 'Tube' },
  { value: 'PIPETTE_TIP', label: 'Embout pipette' },
  { value: 'CULTURE_MEDIA', label: 'Milieu de culture' },
  { value: 'GLOVE', label: 'Gant' },
  { value: 'SWAB', label: 'Ecouvillon' },
];

const UNIT_OPTIONS = [
  { value: 'VIAL', label: 'Flacon(s)' },
  { value: 'PIECE', label: 'Piece(s)' },
  { value: 'BOX', label: 'Boite(s)' },
  { value: 'PACK', label: 'Paquet(s)' },
  { value: 'BOTTLE', label: 'Bouteille(s)' },
  { value: 'KIT', label: 'Kit(s)' },
];

interface ConsumableFormProps {
  onSubmit: (data: CreateConsumableRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}

export function ConsumableForm({ onSubmit, onCancel, loading, defaultValues }: ConsumableFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hazardous: false,
      storage_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const selectedStudyId = watch('study_id');
  const selectedSiteId = watch('site_id');
  const isHazardous = watch('hazardous');

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

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as CreateConsumableRequest))}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Type de consommable"
          options={CONSUMABLE_TYPES}
          value={watch('consumable_type') || ''}
          onValueChange={(val) => setValue('consumable_type', val)}
          error={errors.consumable_type?.message}
          required
        />
        <Input
          label="Fabricant"
          error={errors.manufacturer?.message}
          required
          {...register('manufacturer')}
        />
        <Input
          label="Ref. catalogue"
          error={errors.catalog_number?.message}
          required
          {...register('catalog_number')}
        />
        <Input
          label="N. lot"
          error={errors.lot_number?.message}
          required
          {...register('lot_number')}
        />
        <Input
          label="Quantite"
          type="number"
          error={errors.quantity?.message}
          required
          {...register('quantity', { valueAsNumber: true })}
        />
        <Select
          label="Unite"
          options={UNIT_OPTIONS}
          value={watch('unit') || ''}
          onValueChange={(val) => setValue('unit', val)}
          error={errors.unit?.message}
          required
        />
        <Input
          label="Date d'expiration"
          type="date"
          error={errors.expiry_date?.message}
          required
          {...register('expiry_date')}
        />
        <Input
          label="Conditions de stockage"
          placeholder="Ex: 2-8°C"
          error={errors.storage_conditions?.message}
          {...register('storage_conditions')}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Affectation</legend>
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
            label="Date de stockage"
            type="date"
            error={errors.storage_date?.message}
            required
            {...register('storage_date')}
          />
          <Input
            label="Code interne"
            placeholder="Ex: CONS-2026-001"
            {...register('internal_code')}
          />
        </div>
      </fieldset>

      <Checkbox
        label="Produit dangereux"
        description="Ce consommable est classifie comme dangereux"
        checked={isHazardous}
        onCheckedChange={(checked) => setValue('hazardous', checked === true)}
      />

      {isHazardous && (
        <Input
          label="Classification du danger"
          placeholder="Ex: GHS02, GHS08"
          error={errors.hazard_classification?.message}
          {...register('hazard_classification')}
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
