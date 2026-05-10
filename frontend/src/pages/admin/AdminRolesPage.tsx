import { useState } from 'react';
import { Check, X, Edit2, Save, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdminSubNav } from '@/components/features/admin/AdminSubNav';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useRoles, useUpdateRole } from '@/hooks/useRoles';
import type { RoleDetail } from '@/lib/api/roles';

// All resources and their possible actions
const RESOURCES = [
  { key: 'studies', label: 'Etudes' },
  { key: 'sites', label: 'Sites' },
  { key: 'documents', label: 'Documents' },
  { key: 'equipment', label: 'Equipements' },
  { key: 'consumables', label: 'Consommables' },
  { key: 'containers', label: 'Conteneurs' },
  { key: 'movements', label: 'Mouvements' },
  { key: 'access_requests', label: 'Demandes acces' },
  { key: 'rfid', label: 'RFID' },
  { key: 'reports', label: 'Rapports' },
  { key: 'exports', label: 'Exports' },
  { key: 'audit', label: 'Audit' },
];

const ACTIONS = [
  { key: 'create', label: 'Créer' },
  { key: 'read', label: 'Lire' },
  { key: 'update', label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
  { key: 'approve', label: 'Approuver' },
  { key: 'fulfill', label: 'Executer' },
];

const ROLE_COLORS: Record<string, 'danger' | 'primary' | 'info' | 'warning' | 'purple' | 'success' | 'default'> = {
  ADMIN: 'danger',
  INVESTIGATOR: 'primary',
  ARC: 'info',
  MONITOR: 'warning',
  ARCHIVIST: 'purple',
  DATA_MANAGER: 'success',
  DATA_CLERK: 'default',
};

function hasPermission(permissions: Record<string, Record<string, boolean>>, resource: string, action: string): boolean {
  if (permissions['*']?.[action]) return true;
  return !!permissions[resource]?.[action];
}

function PermissionMatrix({
  role: _role,
  editing,
  permissions,
  onToggle,
}: {
  role: RoleDetail;
  editing: boolean;
  permissions: Record<string, Record<string, boolean>>;
  onToggle: (resource: string, action: string) => void;
}) {
  const isWildcard = !!permissions['*'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-2 pr-3 text-left font-medium text-gray-500 w-32">Ressource</th>
            {ACTIONS.map((a) => (
              <th key={a.key} className="py-2 px-2 text-center font-medium text-gray-500 w-16">
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {RESOURCES.map((r) => (
            <tr key={r.key} className="hover:bg-gray-50">
              <td className="py-2 pr-3 text-gray-700 font-medium">{r.label}</td>
              {ACTIONS.map((a) => {
                const granted = hasPermission(permissions, r.key, a.key);
                const fromWildcard = isWildcard && !!permissions['*']?.[a.key];
                return (
                  <td key={a.key} className="py-2 px-2 text-center">
                    {editing && !fromWildcard ? (
                      <button
                        type="button"
                        onClick={() => onToggle(r.key, a.key)}
                        className={`h-6 w-6 rounded transition-colors mx-auto flex items-center justify-center ${
                          granted
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <span className="mx-auto flex items-center justify-center h-6 w-6">
                        {granted ? (
                          <Check className={`h-3.5 w-3.5 ${fromWildcard ? 'text-blue-500' : 'text-green-500'}`} />
                        ) : (
                          <X className="h-3.5 w-3.5 text-gray-200" />
                        )}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {isWildcard && (
        <p className="mt-2 text-xs text-blue-500">
          * Accès total via permission wildcard — les coches bleues ne sont pas modifiables.
        </p>
      )}
    </div>
  );
}

function RoleCard({ role }: { role: RoleDetail }) {
  const { toast } = useToast();
  const updateRole = useUpdateRole();
  const [editing, setEditing] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
    role.permissions,
  );

  const handleToggle = (resource: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...(prev[resource] ?? {}),
        [action]: !prev[resource]?.[action],
      },
    }));
  };

  const handleSave = () => {
    updateRole.mutate(
      { id: role.id, payload: { permissions } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: `Permissions du role "${role.name}" mises a jour` });
          setEditing(false);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la sauvegarde' }),
      },
    );
  };

  const handleCancel = () => {
    setPermissions(role.permissions);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={ROLE_COLORS[role.code] ?? 'default'}>{role.code}</Badge>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{role.name}</h3>
              {role.description && (
                <p className="text-xs text-gray-500">{role.description}</p>
              )}
            </div>
            {role.is_system_role && (
              <span className="text-xs text-gray-400 italic">(role systeme)</span>
            )}
          </div>
          {!role.is_system_role && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button size="sm" variant="outline" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={handleSave} loading={updateRole.isPending}>
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <PermissionMatrix
          role={role}
          editing={editing && !role.is_system_role}
          permissions={permissions}
          onToggle={handleToggle}
        />
      </CardContent>
    </Card>
  );
}

export default function AdminRolesPage() {
  const { data, isLoading } = useRoles();
  const roles = data?.items ?? [];

  // Show system roles first, then custom
  const sorted = [...roles].sort((a, b) => {
    if (a.is_system_role && !b.is_system_role) return -1;
    if (!a.is_system_role && b.is_system_role) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Consulter et modifier les permissions par role. Les roles systeme sont en lecture seule."
      />
      <AdminSubNav />

      {isLoading ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-gray-500">Chargement...</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
