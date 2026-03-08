import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { CreateEquipmentRequest } from '@/types';

const schema = z.object({
  equipment_type: z.string().min(1, 'Type requis'),
  manufacturer: z.string().min(1, 'Fabricant requis'),
  model: z.string().min(1, 'Modele requis'),
  serial_number: z.string().min(1, 'Numero de serie requis'),
  operational_status: z.string().min(1, 'Statut operationnel requis'),
  study_id: z.string().uuid('Etude requise'),
  site_id: z.string().uuid('Site requis'),
  container_id: z.string().uuid('Conteneur requis'),
  storage_date: z.string().min(1, 'Date de stockage requise'),
  calibration_required: z.boolean(),
  next_calibration_date: z.string().optional(),
  internal_code: z.string().optional(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.coerce.number().optional(),
  currency: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EQUIPMENT_TYPES = [
  { value: 'CENTRIFUGE', label: 'Centrifugeuse' },
  { value: 'REFRIGERATOR', label: 'Refrigerateur' },
  { value: 'FREEZER', label: 'Congelateur' },
  { value: 'INCUBATOR', label: 'Incubateur' },
  { value: 'MICROSCOPE', label: 'Microscope' },
  { value: 'BALANCE', label: 'Balance' },
  { value: 'PH_METER', label: 'pH-metre' },
];

const OPERATIONAL_STATUSES = [
  { value: 'OPERATIONAL', label: 'Operationnel' },
  { value: 'UNDER_MAINTENANCE', label: 'En maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Hors service' },
  { value: 'DECOMMISSIONED', label: 'Decommissionne' },
];

interface EquipmentFormProps {
  onSubmit: (data: CreateEquipmentRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
  studies?: Array<{ value: string; label: string }>;
  sites?: Array<{ value: string; label: string }>;
}

export function EquipmentForm({
  onSubmit,
  onCancel,
  loading,
  defaultValues,
  studies = [],
  sites = [],
}: EquipmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      calibration_required: false,
      operational_status: 'OPERATIONAL',
      currency: 'EUR',
      storage_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const calibrationRequired = watch('calibration_required');

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as CreateEquipmentRequest))}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Identification</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type d'equipement"
            options={EQUIPMENT_TYPES}
            value={watch('equipment_type') || ''}
            onValueChange={(val) => setValue('equipment_type', val)}
            error={errors.equipment_type?.message}
            required
          />
          <Select
            label="Statut operationnel"
            options={OPERATIONAL_STATUSES}
            value={watch('operational_status') || ''}
            onValueChange={(val) => setValue('operational_status', val)}
            error={errors.operational_status?.message}
            required
          />
          <Input
            label="Fabricant"
            placeholder="Ex: Eppendorf"
            error={errors.manufacturer?.message}
            required
            {...register('manufacturer')}
          />
          <Input
            label="Modele"
            placeholder="Ex: Centrifuge 5425"
            error={errors.model?.message}
            required
            {...register('model')}
          />
          <Input
            label="Numero de serie"
            placeholder="Ex: SN-12345678"
            error={errors.serial_number?.message}
            required
            {...register('serial_number')}
          />
          <Input
            label="Code interne"
            placeholder="Ex: EQ-2026-001"
            {...register('internal_code')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Affectation</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {studies.length > 0 ? (
            <Select
              label="Etude"
              options={studies}
              value={watch('study_id') || ''}
              onValueChange={(val) => setValue('study_id', val)}
              error={errors.study_id?.message}
              required
            />
          ) : (
            <Input
              label="ID Etude"
              placeholder="UUID de l'etude"
              error={errors.study_id?.message}
              required
              {...register('study_id')}
            />
          )}
          {sites.length > 0 ? (
            <Select
              label="Site"
              options={sites}
              value={watch('site_id') || ''}
              onValueChange={(val) => setValue('site_id', val)}
              error={errors.site_id?.message}
              required
            />
          ) : (
            <Input
              label="ID Site"
              placeholder="UUID du site"
              error={errors.site_id?.message}
              required
              {...register('site_id')}
            />
          )}
          <Input
            label="ID Conteneur"
            placeholder="UUID du conteneur"
            error={errors.container_id?.message}
            required
            {...register('container_id')}
          />
          <Input
            label="Date de stockage"
            type="date"
            error={errors.storage_date?.message}
            required
            {...register('storage_date')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900 mb-3">Calibration</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="calibration_required"
              {...register('calibration_required')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="calibration_required" className="text-sm text-gray-700">
              Calibration requise
            </label>
          </div>
          {calibrationRequired && (
            <Input
              label="Prochaine calibration"
              type="date"
              {...register('next_calibration_date')}
            />
          )}
        </div>
      </fieldset>

      <Input
        label="Description"
        placeholder="Description optionnelle"
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
