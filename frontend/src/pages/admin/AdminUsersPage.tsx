import { useState } from 'react';
import {
  Plus,
  Search,
  Users,
  Shield,
  MoreVertical,
  UserCheck,
  UserX,
  KeyRound,
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
import { useUsers, useCreateUser, useToggleUserActive } from '@/hooks/useUsers';
import { formatDate } from '@/lib/utils';
import type { User, RoleCode } from '@/types';
import type { UserFilters, CreateUserRequest } from '@/lib/api/users';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

const createUserSchema = z.object({
  username: z.string().min(3, 'Minimum 3 caracteres'),
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Prenom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caracteres'),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleCode>('DATA_CLERK');
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    page_size: 25,
  });

  const { data, isLoading } = useUsers(filters);
  const createUser = useCreateUser();
  const toggleActive = useToggleUserActive();

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
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'default'}>
          {user.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
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
              className="z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleActive.mutate(user.id, {
                    onSuccess: () => toast({
                      variant: 'success',
                      title: user.is_active ? 'Utilisateur desactive' : 'Utilisateur active',
                    }),
                  });
                }}
              >
                {user.is_active ? (
                  <>
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Desactiver</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Activer</span>
                  </>
                )}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100"
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
    const payload: CreateUserRequest = {
      ...formData,
      roles: [selectedRole],
      site_ids: [],
    };
    createUser.mutate(payload, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Utilisateur cree' });
        setShowCreateModal(false);
        reset();
      },
      onError: () => toast({ variant: 'error', title: 'Erreur lors de la creation' }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Administration des comptes utilisateurs et des roles"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Nouvel utilisateur
          </Button>
        }
      />

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
        onOpenChange={setShowCreateModal}
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
            <Input
              label="Mot de passe"
              type="password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
          </div>
          <Select
            label="Role"
            options={ROLE_OPTIONS.filter((r) => r.value !== '')}
            value={selectedRole}
            onValueChange={(val) => setSelectedRole(val as RoleCode)}
            required
          />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Creer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
