import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { documentsApi } from '@/lib/api/documents';
import { equipmentApi } from '@/lib/api/equipment';
import { consumablesApi } from '@/lib/api/consumables';

type ItemCategory = 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE' | '';

const schema = z.object({
  item_id: z.string().uuid('Veuillez selectionner un article valide'),
  request_type: z.enum(['CONSULTATION', 'COPY', 'LOAN'], { required_error: 'Type requis' }),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'], { required_error: 'Urgence requise' }),
  reason: z.string().min(10, 'Motif trop court (min. 10 caracteres)'),
  needed_by: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'EQUIPMENT', label: 'Equipement' },
  { value: 'CONSUMABLE', label: 'Consommable' },
];

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
  const [category, setCategory] = useState<ItemCategory>('');

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: 'NORMAL', request_type: 'CONSULTATION', ...defaultValues },
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', { page_size: 100 }],
    queryFn: () => documentsApi.getAll({ page_size: 100 }),
    enabled: category === 'DOCUMENT',
    staleTime: 60_000,
  });

  const { data: equipData, isLoading: equipLoading } = useQuery({
    queryKey: ['equipment', { page_size: 100 }],
    queryFn: () => equipmentApi.getAll({ page_size: 100 }),
    enabled: category === 'EQUIPMENT',
    staleTime: 60_000,
  });

  const { data: consumData, isLoading: consumLoading } = useQuery({
    queryKey: ['consumables', { page_size: 100 }],
    queryFn: () => consumablesApi.getAll({ page_size: 100 }),
    enabled: category === 'CONSUMABLE',
    staleTime: 60_000,
  });

  const itemsLoading = docsLoading || equipLoading || consumLoading;

  const itemOptions = useMemo(() => {
    if (category === 'DOCUMENT') {
      return (docsData?.items ?? []).map((doc) => ({
        value: doc.id,
        label: `${doc.document_type} — ${doc.subject_id} / ${doc.form_name} (v${doc.version})`,
      }));
    }
    if (category === 'EQUIPMENT') {
      return (equipData?.items ?? []).map((eq) => ({
        value: eq.id,
        label: `${eq.equipment_type} — ${eq.manufacturer} ${eq.model} (${eq.serial_number})`,
      }));
    }
    if (category === 'CONSUMABLE') {
      return (consumData?.items ?? []).map((c) => ({
        value: c.id,
        label: `${c.consumable_type} — ${c.manufacturer} / Lot: ${c.lot_number}`,
      }));
    }
    return [];
  }, [category, docsData, equipData, consumData]);

  const handleCategoryChange = (val: string) => {
    setCategory(val as ItemCategory);
    setValue('item_id', '', { shouldValidate: false });
  };

  const itemPlaceholder = itemsLoading
    ? 'Chargement...'
    : !category
      ? 'Selectionnez d\'abord une categorie'
      : itemOptions.length === 0
        ? 'Aucun article disponible'
        : 'Selectionner un article...';

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

        {/* Category selector */}
        <Select
          label="Categorie d'article"
          options={CATEGORY_OPTIONS}
          value={category}
          onValueChange={handleCategoryChange}
          placeholder="Selectioner une categorie..."
          required
        />

        {/* Item selector filtered by category */}
        <Controller
          control={control}
          name="item_id"
          render={({ field }) => (
            <Select
              label="Article"
              options={itemOptions}
              value={field.value || ''}
              onValueChange={field.onChange}
              placeholder={itemPlaceholder}
              disabled={!category || itemsLoading || itemOptions.length === 0}
              error={errors.item_id?.message}
              required
            />
          )}
        />

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
