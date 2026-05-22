import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Package, FileText, FlaskConical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { documentsApi } from '@/lib/api/documents';
import { equipmentApi } from '@/lib/api/equipment';
import { consumablesApi } from '@/lib/api/consumables';
import type { RequestType, Urgency } from '@/types';

type ItemCategory = 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE' | '';

interface SelectedItem {
  id: string;
  label: string;
  type: ItemCategory;
}

const schema = z.object({
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

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  DOCUMENT: <FileText className="h-3.5 w-3.5" />,
  EQUIPMENT: <Package className="h-3.5 w-3.5" />,
  CONSUMABLE: <FlaskConical className="h-3.5 w-3.5" />,
};

interface AccessRequestFormProps {
  onSubmit: (data: { item_ids: string[]; request_type: RequestType; urgency: Urgency; reason: string; needed_by?: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AccessRequestForm({ onSubmit, onCancel, loading }: AccessRequestFormProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [addCategory, setAddCategory] = useState<ItemCategory>('');
  const [addItemId, setAddItemId] = useState('');
  const [itemsError, setItemsError] = useState('');

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgency: 'NORMAL', request_type: 'CONSULTATION' },
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', { page_size: 100 }],
    queryFn: () => documentsApi.getAll({ page_size: 100 }),
    enabled: addCategory === 'DOCUMENT',
    staleTime: 60_000,
  });

  const { data: equipData, isLoading: equipLoading } = useQuery({
    queryKey: ['equipment', { page_size: 100 }],
    queryFn: () => equipmentApi.getAll({ page_size: 100 }),
    enabled: addCategory === 'EQUIPMENT',
    staleTime: 60_000,
  });

  const { data: consumData, isLoading: consumLoading } = useQuery({
    queryKey: ['consumables', { page_size: 100 }],
    queryFn: () => consumablesApi.getAll({ page_size: 100 }),
    enabled: addCategory === 'CONSUMABLE',
    staleTime: 60_000,
  });

  const itemsLoading = docsLoading || equipLoading || consumLoading;

  const availableOptions = useMemo(() => {
    const alreadySelected = new Set(selectedItems.map((i) => i.id));
    if (addCategory === 'DOCUMENT') {
      return (docsData?.items ?? [])
        .filter((d) => !alreadySelected.has(d.id))
        .map((doc) => ({
          value: doc.id,
          label: `${doc.internal_code ?? doc.id.slice(0, 8)} — ${doc.document_type}${doc.subject_id ? ` / Sujet ${doc.subject_id}` : ''}`,
        }));
    }
    if (addCategory === 'EQUIPMENT') {
      return (equipData?.items ?? [])
        .filter((e) => !alreadySelected.has(e.id))
        .map((eq) => ({
          value: eq.id,
          label: `${eq.internal_code ?? eq.id.slice(0, 8)} — ${eq.manufacturer} ${eq.model}`,
        }));
    }
    if (addCategory === 'CONSUMABLE') {
      return (consumData?.items ?? [])
        .filter((c) => !alreadySelected.has(c.id))
        .map((c) => ({
          value: c.id,
          label: `${c.internal_code ?? c.id.slice(0, 8)} — Lot: ${c.lot_number}`,
        }));
    }
    return [];
  }, [addCategory, docsData, equipData, consumData, selectedItems]);

  const handleAddItem = () => {
    if (!addItemId || !addCategory) return;
    const option = availableOptions.find((o) => o.value === addItemId);
    if (!option) return;
    setSelectedItems((prev) => [...prev, { id: addItemId, label: option.label, type: addCategory }]);
    setAddItemId('');
    setItemsError('');
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleFormSubmit = (data: FormValues) => {
    if (selectedItems.length === 0) {
      setItemsError('Veuillez ajouter au moins un article');
      return;
    }
    onSubmit({
      item_ids: selectedItems.map((i) => i.id),
      request_type: data.request_type as RequestType,
      urgency: data.urgency as Urgency,
      reason: data.reason,
      needed_by: data.needed_by || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Type + Urgence */}
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
      </div>

      {/* Articles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Articles demandes <span className="text-red-500">*</span>
          </span>
          {selectedItems.length > 0 && (
            <span className="text-xs text-gray-500">{selectedItems.length} article(s)</span>
          )}
        </div>

        {/* Selected items list */}
        {selectedItems.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-gray-50">
            {selectedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                <span className="text-gray-400">{ITEM_TYPE_ICONS[item.type as string]}</span>
                <span className="flex-1 truncate text-sm text-gray-800">{item.label}</span>
                <Badge variant="default" className="shrink-0 text-xs">
                  {item.type}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-1 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add item row */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <Select
            options={CATEGORY_OPTIONS}
            value={addCategory}
            onValueChange={(v) => { setAddCategory(v as ItemCategory); setAddItemId(''); }}
            placeholder="Categorie..."
          />
          <Select
            options={availableOptions}
            value={addItemId}
            onValueChange={setAddItemId}
            placeholder={
              itemsLoading ? 'Chargement...'
              : !addCategory ? "Choisir d'abord une categorie"
              : availableOptions.length === 0 ? 'Aucun article disponible'
              : 'Selectionner un article...'
            }
            disabled={!addCategory || itemsLoading || availableOptions.length === 0}
          />
          <Button
            type="button"
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleAddItem}
            disabled={!addItemId}
          >
            Ajouter
          </Button>
        </div>

        {itemsError && (
          <p className="text-xs text-red-600">{itemsError}</p>
        )}
      </div>

      {/* Date limite */}
      <Input
        label="Requis pour le (optionnel)"
        type="date"
        error={errors.needed_by?.message}
        {...register('needed_by')}
      />

      {/* Motif */}
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
