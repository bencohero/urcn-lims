import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  item_id: z.string().uuid('Identifiant article invalide (UUID requis)'),
  request_type: z.enum(['CONSULTATION', 'COPY', 'LOAN'], { required_error: 'Type requis' }),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], { required_error: 'Urgence requise' }),
  reason: z.string().min(10, 'Motif trop court (min. 10 caracteres)'),
  needed_by: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' },
];

const REQUEST_TYPE_OPTIONS = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'COPY', label: 'Copie' },
  { value: 'LOAN', label: 'Pret' },
];

interface AccessRequestFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}

export function AccessRequestForm({ onSubmit, onCancel, loading, defaultValues }: AccessRequestFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: 'NORMAL', request_type: 'CONSULTATION', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="request_type"
          render={({ field }) => (
            <Select
              label="Type de demande"
              options={REQUEST_TYPE_OPTIONS}
              value={field.value || ''}
              onValueChange={field.onChange}
              error={errors.request_type?.message}
              required
            />
          )}
        />
        <Controller
          control={control}
          name="urgency"
          render={({ field }) => (
            <Select
              label="Urgence"
              options={URGENCY_OPTIONS}
              value={field.value || ''}
              onValueChange={field.onChange}
              error={errors.urgency?.message}
              required
            />
          )}
        />
        <div className="sm:col-span-2">
          <Input
            label="ID de l'article"
            placeholder="UUID de l'article stocke"
            error={errors.item_id?.message}
            required
            {...register('item_id')}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Requis pour le (optionnel)"
            type="date"
            error={errors.needed_by?.message}
            {...register('needed_by')}
          />
        </div>
      </div>
      <Textarea
        label="Motif de la demande"
        placeholder="Decrivez le motif de votre demande d'acces (min. 10 caracteres)..."
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
