import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  equipment_type: z.string().min(1, 'Type requis'),
  manufacturer: z.string().min(1, 'Fabricant requis'),
  model: z.string().min(1, 'Modele requis'),
  serial_number: z.string().min(1, 'Numero de serie requis'),
  study_id: z.string().uuid('Etude requise'),
  site_id: z.string().uuid('Site requis'),
  description: z.string().optional(),
  calibration_interval_days: z.number().int().positive().optional(),
});

type FormValues = z.infer<typeof schema>;

const EQUIPMENT_TYPES = [
  { value: 'CENTRIFUGE', label: 'Centrifugeuse' },
  { value: 'REFRIGERATOR', label: 'Refrigerateur' },
  { value: 'FREEZER', label: 'Congelateur' },
  { value: 'INCUBATOR', label: 'Incubateur' },
  { value: 'THERMOMETER', label: 'Thermometre' },
  { value: 'SCALE', label: 'Balance' },
  { value: 'OTHER', label: 'Autre' },
];

interface EquipmentFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
  studies?: Array<{ value: string; label: string }>;
  sites?: Array<{ value: string; label: string }>;
}

export function EquipmentForm({ onSubmit, onCancel, loading, defaultValues, studies = [], sites = [] }: EquipmentFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Type d'equipement"
          options={EQUIPMENT_TYPES}
          value={watch('equipment_type') || ''}
          onValueChange={(val) => setValue('equipment_type', val)}
          error={errors.equipment_type?.message}
          required
        />
        <Input
          label="Numero de serie"
          error={errors.serial_number?.message}
          required
          {...register('serial_number')}
        />
        <Input
          label="Fabricant"
          error={errors.manufacturer?.message}
          required
          {...register('manufacturer')}
        />
        <Input
          label="Modele"
          error={errors.model?.message}
          required
          {...register('model')}
        />
        <Select
          label="Etude"
          options={studies}
          value={watch('study_id') || ''}
          onValueChange={(val) => setValue('study_id', val)}
          error={errors.study_id?.message}
          required
        />
        <Select
          label="Site"
          options={sites}
          value={watch('site_id') || ''}
          onValueChange={(val) => setValue('site_id', val)}
          error={errors.site_id?.message}
          required
        />
        <Input
          label="Intervalle de calibration (jours)"
          type="number"
          error={errors.calibration_interval_days?.message}
          {...register('calibration_interval_days', { valueAsNumber: true })}
        />
      </div>
      <Textarea
        label="Description"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Annuler</Button>
        <Button type="submit" loading={loading}>Enregistrer</Button>
      </div>
    </form>
  );
}
