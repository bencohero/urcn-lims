import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  consumable_type: z.string().min(1, 'Type requis'),
  manufacturer: z.string().min(1, 'Fabricant requis'),
  catalog_number: z.string().min(1, 'Reference catalogue requise'),
  lot_number: z.string().min(1, 'Numero de lot requis'),
  quantity: z.number().int().positive('Quantite requise'),
  unit: z.string().min(1, 'Unite requise'),
  expiry_date: z.string().min(1, 'Date d\'expiration requise'),
  study_id: z.string().uuid('Etude requise'),
  site_id: z.string().uuid('Site requis'),
  hazardous: z.boolean().optional(),
  hazard_classification: z.string().optional(),
  storage_conditions: z.string().optional(),
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
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
  studies?: Array<{ value: string; label: string }>;
  sites?: Array<{ value: string; label: string }>;
}

export function ConsumableForm({ onSubmit, onCancel, loading, defaultValues, studies = [], sites = [] }: ConsumableFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { hazardous: false, ...defaultValues },
  });

  const isHazardous = watch('hazardous');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          error={errors.storage_conditions?.message}
          {...register('storage_conditions')}
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
      </div>

      <Checkbox
        label="Produit dangereux"
        description="Ce consommable est classifie comme dangereux"
        checked={isHazardous}
        onCheckedChange={(checked) => setValue('hazardous', checked === true)}
      />

      {isHazardous && (
        <Input
          label="Classification du danger"
          error={errors.hazard_classification?.message}
          {...register('hazard_classification')}
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Annuler</Button>
        <Button type="submit" loading={loading}>Enregistrer</Button>
      </div>
    </form>
  );
}
