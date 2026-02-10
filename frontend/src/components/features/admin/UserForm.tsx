import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  username: z.string().min(3, 'Minimum 3 caracteres'),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Prenom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  role: z.string().min(1, 'Role requis'),
  password: z.string().min(8, 'Minimum 8 caracteres').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'INVESTIGATOR', label: 'Investigateur' },
  { value: 'ARC', label: 'ARC' },
  { value: 'MONITOR', label: 'Moniteur' },
  { value: 'ARCHIVIST', label: 'Archiviste' },
  { value: 'DATA_MANAGER', label: 'Data Manager' },
  { value: 'DATA_CLERK', label: 'Data Clerk' },
];

interface UserFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
  isEdit?: boolean;
}

export function UserForm({ onSubmit, onCancel, loading, defaultValues, isEdit }: UserFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nom d'utilisateur"
          error={errors.username?.message}
          required
          disabled={isEdit}
          {...register('username')}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          required
          {...register('email')}
        />
        <Input
          label="Prenom"
          error={errors.first_name?.message}
          required
          {...register('first_name')}
        />
        <Input
          label="Nom"
          error={errors.last_name?.message}
          required
          {...register('last_name')}
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={watch('role') || ''}
          onValueChange={(val) => setValue('role', val)}
          error={errors.role?.message}
          required
        />
        {!isEdit && (
          <Input
            label="Mot de passe"
            type="password"
            error={errors.password?.message}
            required={!isEdit}
            {...register('password')}
          />
        )}
      </div>
      <Checkbox
        label="Compte actif"
        description="L'utilisateur peut se connecter au systeme"
        checked={watch('is_active')}
        onCheckedChange={(checked) => setValue('is_active', checked === true)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Annuler</Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Mettre a jour' : 'Creer'}
        </Button>
      </div>
    </form>
  );
}
