import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useUserSiteRoles, useAssignSiteRole, useUnassignSiteRole } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useSites } from '@/hooks/useSites';
import type { User, RoleCode } from '@/types';

const ROLE_COLORS: Record<string, 'danger' | 'primary' | 'info' | 'warning' | 'purple' | 'success' | 'default'> = {
  ADMIN: 'danger',
  INVESTIGATOR: 'primary',
  ARC: 'info',
  MONITOR: 'warning',
  ARCHIVIST: 'purple',
  DATA_MANAGER: 'success',
  DATA_CLERK: 'default',
};

interface SiteRoleAssignmentModalProps {
  user: User;
  onClose: () => void;
}

export function SiteRoleAssignmentModal({ user, onClose }: SiteRoleAssignmentModalProps) {
  const { toast } = useToast();
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: assignments, isLoading } = useUserSiteRoles(user.id);
  const { data: rolesData } = useRoles();
  const { data: sitesData } = useSites({ page_size: 100 });
  const assign = useAssignSiteRole();
  const unassign = useUnassignSiteRole();

  const roleOptions = (rolesData?.items ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const siteOptions = (sitesData?.items ?? []).map((s) => ({
    value: s.id,
    label: `${s.site_number} — ${s.name}`,
  }));

  const active = (assignments ?? []).filter((a) => a.is_active);
  const inactive = (assignments ?? []).filter((a) => !a.is_active);

  const handleAssign = () => {
    if (!selectedSiteId || !selectedRoleId) return;
    assign.mutate(
      { id: user.id, site_id: selectedSiteId, role_id: selectedRoleId, is_primary: isPrimary },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Affectation ajoutee' });
          setSelectedSiteId('');
          setSelectedRoleId('');
          setIsPrimary(false);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          toast({ variant: 'error', title: msg ?? 'Erreur lors de l\'affectation' });
        },
      },
    );
  };

  const handleUnassign = (siteId: string, roleId: string, roleName: string, siteName: string) => {
    unassign.mutate(
      { id: user.id, site_id: siteId, role_id: roleId },
      {
        onSuccess: () => toast({ variant: 'success', title: `Role ${roleName} retire du site ${siteName}` }),
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la suppression' }),
      },
    );
  };

  return (
    <Modal
      open
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Affectations site / role"
      description={`Gerer les acces de ${user.first_name} ${user.last_name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Add assignment */}
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Nouvelle affectation</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Site"
              options={siteOptions}
              value={selectedSiteId}
              onValueChange={setSelectedSiteId}
              placeholder="Selectionner un site..."
            />
            <Select
              label="Role"
              options={roleOptions}
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              placeholder="Selectionner un role..."
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              Contact principal sur ce site
            </label>
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAssign}
              disabled={!selectedSiteId || !selectedRoleId}
              loading={assign.isPending}
            >
              Affecter
            </Button>
          </div>
        </div>

        {/* Active assignments */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Affectations actives ({active.length})
          </p>
          {isLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : active.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune affectation active</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {active.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={ROLE_COLORS[a.role_code as RoleCode] ?? 'default'}>
                      {a.role_name}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.site_name}</p>
                      <p className="text-xs text-gray-500">{a.site_number}</p>
                    </div>
                    {a.is_primary && (
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" title="Contact principal" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnassign(a.site_id, a.role_id, a.role_name, a.site_name)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Retirer cette affectation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inactive assignments */}
        {inactive.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              Voir les affectations inactives ({inactive.length})
            </summary>
            <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50">
              {inactive.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-2.5 opacity-60">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{a.role_name}</Badge>
                    <p className="text-sm text-gray-600">{a.site_name}</p>
                  </div>
                  <span className="text-xs text-gray-400">Retire</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-3">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
}
