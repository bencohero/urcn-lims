import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  item_id: z.string().uuid('Article requis'),
  item_type: z.string().min(1, 'Type requis'),
  urgency: z.string().min(1, 'Urgence requise'),
  reason: z.string().min(10, 'Motif trop court (min. 10 caracteres)'),
  needed_by: z.string().min(1, 'Date requise'),
  loan_duration_days: z.number().int().positive().max(30),
});

type FormValues = z.infer<typeof schema>;

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'URGENT', label: 'Urgente' },
];

const ITEM_TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'EQUIPMENT', label: 'Equipement' },
  { value: 'CONSUMABLE', label: 'Consommable' },
];

interface AccessRequestFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}

export function AccessRequestForm({ onSubmit, onCancel, loading, defaultValues }: AccessRequestFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { loan_duration_days: 7, urgency: 'NORMAL', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Type d'article"
          options={ITEM_TYPE_OPTIONS}
          value={watch('item_type') || ''}
          onValueChange={(val) => setValue('item_type', val)}
          error={errors.item_type?.message}
          required
        />
        <Input
          label="ID de l'article"
          placeholder="UUID de l'article"
          error={errors.item_id?.message}
          required
          {...register('item_id')}
        />
        <Select
          label="Urgence"
          options={URGENCY_OPTIONS}
          value={watch('urgency') || ''}
          onValueChange={(val) => setValue('urgency', val)}
          error={errors.urgency?.message}
          required
        />
        <Input
          label="Requis pour le"
          type="date"
          error={errors.needed_by?.message}
          required
          {...register('needed_by')}
        />
        <Input
          label="Duree du pret (jours)"
          type="number"
          error={errors.loan_duration_days?.message}
          required
          {...register('loan_duration_days', { valueAsNumber: true })}
        />
      </div>
      <Textarea
        label="Motif de la demande"
        placeholder="Decrivez le motif de votre demande d'acces..."
        error={errors.reason?.message}
        required
        rows={3}
        {...register('reason')}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Annuler</Button>
        <Button type="submit" loading={loading}>Soumettre</Button>
      </div>
    </form>
  );
}
