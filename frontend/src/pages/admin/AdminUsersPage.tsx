import { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  KeyRound,
  Pencil,
  Unlock,
  Network,
  Info,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser,
  useUnlockUser,
  useAdminResetPassword,
} from '@/hooks/useUsers';
import { UserForm } from '@/components/features/admin/UserForm';
import { AdminSubNav } from '@/components/features/admin/AdminSubNav';
import { SiteRoleAssignmentModal } from '@/components/features/admin/SiteRoleAssignmentModal';
import { formatDate } from '@/lib/utils/utils';
import type { User, RoleCode } from '@/types';
import type { UserFilters } from '@/lib/api/users';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les roles' },
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'INVESTIGATOR', label: 'Investigateur' },
  { value: 'ARC', label: 'ARC' },
  { value: 'MONITOR', label: 'Moniteur' },
  { value: 'ARCHIVIST', label: 'Archiviste' },
  { value: 'DATA_MANAGER', label: 'Data Manager' },
  { value: 'DATA_CLERK', label: 'Data Clerk' },
];

const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: 'Admin',
  INVESTIGATOR: 'Investigateur',
  ARC: 'ARC',
  MONITOR: 'Moniteur',
  ARCHIVIST: 'Archiviste',
  DATA_MANAGER: 'Data Manager',
  DATA_CLERK: 'Data Clerk',
};

const ROLE_COLORS: Record<RoleCode, 'danger' | 'primary' | 'info' | 'warning' | 'purple' | 'success' | 'default'> = {
  ADMIN: 'danger',
  INVESTIGATOR: 'primary',
  ARC: 'info',
  MONITOR: 'warning',
  ARCHIVIST: 'purple',
  DATA_MANAGER: 'success',
  DATA_CLERK: 'default',
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PASSWORD_HINT = 'Min. 12 caracteres, avec majuscule, minuscule, chiffre et caractere special.';

const passwordRules = z
  .string()
  .min(12, 'Minimum 12 caracteres')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Au moins un caractere special');

const createUserSchema = z.object({
  username: z.string().min(3, 'Minimum 3 caracteres'),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Prenom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  password: passwordRules,
});

const resetPasswordSchema = z
  .object({
    new_password: passwordRules,
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const resetPassword = useAdminResetPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword.mutate(
      { id: user.id, payload: { new_password: values.new_password } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Mot de passe reinitialise' });
          reset();
          onClose();
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la reinitialisation' }),
      },
    );
  };

  return (
    <Modal
      open
      onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}
      title="Reinitialiser le mot de passe"
      description={`Definir un nouveau mot de passe pour ${user.first_name} ${user.last_name}`}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {PASSWORD_HINT}
        </div>
        <Input
          label="Nouveau mot de passe"
          type="password"
          error={errors.new_password?.message}
          required
          {...register('new_password')}
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
            Annuler
          </Button>
          <Button type="submit" loading={resetPassword.isPending}>
            Reinitialiser
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    page_size: 25,
  });

  const { data, isLoading } = useUsers(filters);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const unlockUser = useUnlockUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.code} variant={ROLE_COLORS[role.code]}>
              {ROLE_LABELS[role.code]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'sites',
      header: 'Sites',
      render: (user) => (
        <span className="text-sm text-gray-600">
          {user.sites.length > 0 ? user.sites.map((s) => s.name).join(', ') : '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (user) => {
        const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={user.is_active ? 'success' : 'default'}>
              {user.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            {isLocked && (
              <Badge variant="warning">Bloque</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'last_login',
      header: 'Derniere connexion',
      sortable: true,
      render: (user) => user.last_login ? formatDate(user.last_login) : 'Jamais',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (user) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                onSelect={(e) => { e.preventDefault(); setUserToEdit(user); }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                Modifier
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                onSelect={(e) => { e.preventDefault(); setUserToAssign(user); }}
              >
                <Network className="h-4 w-4 text-gray-500" />
                Affectations
              </DropdownMenu.Item>
              {user.is_active ? (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                  onSelect={(e) => {
                    e.preventDefault();
                    deactivateUser.mutate(user.id, {
                      onSuccess: () => toast({ variant: 'success', title: 'Utilisateur desactive' }),
                      onError: () => toast({ variant: 'error', title: 'Erreur' }),
                    });
                  }}
                >
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Desactiver</span>
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                  onSelect={(e) => {
                    e.preventDefault();
                    activateUser.mutate(user.id, {
                      onSuccess: () => toast({ variant: 'success', title: 'Utilisateur active' }),
                      onError: () => toast({ variant: 'error', title: 'Erreur' }),
                    });
                  }}
                >
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Activer</span>
                </DropdownMenu.Item>
              )}
              {user.locked_until && new Date(user.locked_until) > new Date() && (
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                  onSelect={(e) => {
                    e.preventDefault();
                    unlockUser.mutate(user.id, {
                      onSuccess: () => toast({ variant: 'success', title: 'Compte debloque' }),
                      onError: () => toast({ variant: 'error', title: 'Erreur' }),
                    });
                  }}
                >
                  <Unlock className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600">Debloquer</span>
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                onSelect={(e) => { e.preventDefault(); setUserToReset(user); }}
              >
                <KeyRound className="h-4 w-4 text-gray-500" />
                Reinitialiser MDP
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ),
    },
  ];

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const onCreateSubmit = (formData: CreateUserFormValues) => {
    createUser.mutate(formData, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Utilisateur cree' });
        setShowCreateModal(false);
        reset();
      },
      onError: (err: unknown) => {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        toast({ variant: 'error', title: typeof detail === 'string' ? detail : 'Erreur lors de la creation' });
      },
    });
  };

  const onEditSubmit = (formData: { username: string; email: string; first_name: string; last_name: string; role: string; is_active: boolean }) => {
    if (!userToEdit) return;
    updateUser.mutate(
      {
        id: userToEdit.id,
        payload: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Utilisateur mis a jour' });
          setUserToEdit(null);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la mise a jour' }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Administration"
        description="Gestion des utilisateurs, audit et parametres systeme"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nouvel utilisateur
          </Button>
        }
      />

      <AdminSubNav />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              placeholder="Rechercher..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
            <Select
              options={ROLE_OPTIONS}
              value={filters.role || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  role: (val || undefined) as RoleCode | undefined,
                  page: 1,
                }))
              }
              placeholder="Role"
            />
            <Select
              options={[
                { value: '', label: 'Tous' },
                { value: 'true', label: 'Actifs' },
                { value: 'false', label: 'Inactifs' },
              ]}
              value={filters.is_active === undefined ? '' : String(filters.is_active)}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  is_active: val === '' ? undefined : val === 'true',
                  page: 1,
                }))
              }
              placeholder="Statut"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          pagination={data?.pagination}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          sortBy={filters.sort_by}
          sortOrder={filters.sort_order}
          onSort={handleSort}
          rowKey={(user) => user.id}
          emptyTitle="Aucun utilisateur"
          emptyDescription="Aucun utilisateur ne correspond aux filtres"
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={(v) => { if (!v) reset(); setShowCreateModal(v); }}
        title="Nouvel utilisateur"
        description="Creer un nouveau compte utilisateur"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nom d'utilisateur"
              error={errors.username?.message}
              required
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
            <Input
              label="Telephone"
              {...register('phone')}
            />
            <div className="space-y-1">
              <Input
                label="Mot de passe"
                type="password"
                error={errors.password?.message}
                required
                {...register('password')}
              />
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Info className="h-3 w-3 shrink-0" />
                {PASSWORD_HINT}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); setShowCreateModal(false); }}>
              Annuler
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Creer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {userToEdit && (
        <Modal
          open
          onOpenChange={(v) => { if (!v) setUserToEdit(null); }}
          title="Modifier l'utilisateur"
          description={`Modifier le compte de ${userToEdit.first_name} ${userToEdit.last_name}`}
          size="lg"
        >
          <UserForm
            isEdit
            loading={updateUser.isPending}
            defaultValues={{
              username: userToEdit.username,
              email: userToEdit.email,
              first_name: userToEdit.first_name,
              last_name: userToEdit.last_name,
              is_active: userToEdit.is_active,
            }}
            onSubmit={onEditSubmit}
            onCancel={() => setUserToEdit(null)}
          />
        </Modal>
      )}

      {/* Reset Password Modal */}
      {userToReset && (
        <ResetPasswordModal
          user={userToReset}
          onClose={() => setUserToReset(null)}
        />
      )}

      {/* Site Role Assignment Modal */}
      {userToAssign && (
        <SiteRoleAssignmentModal
          user={userToAssign}
          onClose={() => setUserToAssign(null)}
        />
      )}
    </div>
  );
}
