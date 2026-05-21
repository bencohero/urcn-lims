import { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
  X,
  ChevronRight,
  ChevronDown,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdminSubNav } from '@/components/features/admin/AdminSubNav';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { useAuditTrail, useVerifyIntegrity } from '@/hooks/useAuditTrail';
import { auditTrailApi } from '@/lib/api/auditTrail';
import { formatDateTime } from '@/lib/utils/utils';
import type { AuditEntry, AuditTrailFilters } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_NAME_OPTIONS = [
  { value: '', label: 'Toutes les tables' },
  { value: 'documents', label: 'Documents' },
  { value: 'equipment', label: 'Équipements' },
  { value: 'consumables', label: 'Consommables' },
  { value: 'stored_items', label: 'Articles stockés' },
  { value: 'movements', label: 'Mouvements' },
  { value: 'access_requests', label: 'Demandes d\'accès' },
  { value: 'users', label: 'Utilisateurs' },
  { value: 'rfid_tags', label: 'Tags RFID' },
  { value: 'storage_locations', label: 'Emplacements' },
  { value: 'containers', label: 'Conteneurs' },
  { value: 'studies', label: 'Études' },
  { value: 'sites', label: 'Sites' },
];

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'CREATE', label: 'Création' },
  { value: 'UPDATE', label: 'Modification' },
  { value: 'DELETE', label: 'Suppression' },
  { value: 'LOGIN', label: 'Connexion' },
  { value: 'LOGOUT', label: 'Déconnexion' },
  { value: 'READ', label: 'Lecture' },
  { value: 'VERIFY', label: 'Vérification' },
  { value: 'ARCHIVE', label: 'Archivage' },
  { value: 'RESTORE', label: 'Restauration' },
];

const TABLE_LABELS: Record<string, string> = {
  documents: 'Documents',
  equipment: 'Équipements',
  consumables: 'Consommables',
  stored_items: 'Articles',
  movements: 'Mouvements',
  access_requests: 'Demandes',
  users: 'Utilisateurs',
  rfid_tags: 'Tags RFID',
  storage_locations: 'Emplacements',
  containers: 'Conteneurs',
  studies: 'Études',
  sites: 'Sites',
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; variant: 'success' | 'info' | 'danger' | 'warning' | 'default' }> = {
  CREATE: { label: 'Création', variant: 'success' },
  UPDATE: { label: 'Modification', variant: 'info' },
  DELETE: { label: 'Suppression', variant: 'danger' },
  LOGIN: { label: 'Connexion', variant: 'success' },
  LOGOUT: { label: 'Déconnexion', variant: 'default' },
  READ: { label: 'Lecture', variant: 'default' },
  VERIFY: { label: 'Vérification', variant: 'info' },
  ARCHIVE: { label: 'Archivage', variant: 'warning' },
  RESTORE: { label: 'Restauration', variant: 'warning' },
};

function getEventConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] ?? { label: eventType, variant: 'default' as const };
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function JsonDiff({
  label,
  data,
  colorClass,
}: {
  label: string;
  data: Record<string, unknown> | null;
  colorClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  const keys = Object.keys(data);
  return (
    <div className={`rounded-lg border ${colorClass} p-3`}>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {keys.map((k) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="w-32 shrink-0 font-medium text-gray-600">{k}</span>
              <span className="font-mono text-gray-800 break-all">
                {data[k] === null ? <span className="text-gray-400 italic">null</span> : String(data[k])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditDetailModal({
  entry,
  onClose,
}: {
  entry: AuditEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;
  const ev = getEventConfig(entry.event_type);

  return (
    <Modal open={!!entry} onOpenChange={(open) => !open && onClose()} title="Détail de l'entrée d'audit" size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3">
          <Badge variant={ev.variant}>{ev.label}</Badge>
          {entry.table_name && (
            <span className="text-sm text-gray-600">
              Table : <strong>{TABLE_LABELS[entry.table_name] ?? entry.table_name}</strong>
            </span>
          )}
          {entry.record_id && (
            <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700">
              ID: {entry.record_id.slice(0, 8)}…
            </code>
          )}
        </div>

        {/* Action */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Action</p>
          <p className="text-sm text-gray-900">{entry.action}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Date / Heure</p>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(entry.timestamp)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Utilisateur</p>
            {entry.user ? (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.user.full_name}</p>
                  <p className="text-xs text-gray-500">@{entry.user.username}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Système</p>
            )}
          </div>
          {entry.ip_address && (
            <div>
              <p className="text-xs text-gray-500">Adresse IP</p>
              <code className="text-sm text-gray-700">{entry.ip_address}</code>
            </div>
          )}
        </div>

        {/* Values diff */}
        {(entry.old_values || entry.new_values) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Données modifiées</p>
            <JsonDiff label="Anciennes valeurs" data={entry.old_values} colorClass="border-red-200 bg-red-50 text-red-700" />
            <JsonDiff label="Nouvelles valeurs" data={entry.new_values} colorClass="border-green-200 bg-green-50 text-green-700" />
          </div>
        )}

        {/* Hash */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Hash SHA-256</p>
          <code className="block break-all rounded bg-gray-100 p-2 text-xs text-gray-600">
            {entry.hash_current}
          </code>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} icon={<X className="h-4 w-4" />}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditTrailFilters>({ page: 1, page_size: 50 });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAuditTrail(filters);
  const verifyIntegrity = useVerifyIntegrity();

  const handleVerifyIntegrity = () => {
    verifyIntegrity.mutate(undefined, {
      onSuccess: (result) => {
        if (result.integrity_valid) {
          toast({
            variant: 'success',
            title: 'Intégrité vérifiée',
            description: `${result.total_records_checked} enregistrements vérifiés — chaîne intacte`,
          });
        } else {
          toast({
            variant: 'error',
            title: 'Anomalie détectée',
            description: result.details?.message ?? 'La chaîne d\'intégrité est compromise',
          });
        }
      },
      onError: () => toast({ variant: 'error', title: 'Erreur de vérification' }),
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await auditTrailApi.export({
        format: 'csv',
        from_date: filters.from_timestamp,
        to_date: filters.to_timestamp,
        table_name: filters.table_name,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ variant: 'success', title: 'Export téléchargé' });
    } catch {
      toast({ variant: 'error', title: 'Erreur d\'export' });
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<AuditEntry>[] = [
    {
      key: 'timestamp',
      header: 'Date / Heure',
      sortable: true,
      render: (entry) => (
        <span className="whitespace-nowrap text-xs text-gray-600">{formatDateTime(entry.timestamp)}</span>
      ),
    },
    {
      key: 'event_type',
      header: 'Action',
      render: (entry) => {
        const ev = getEventConfig(entry.event_type);
        return <Badge variant={ev.variant}>{ev.label}</Badge>;
      },
    },
    {
      key: 'table_name',
      header: 'Table',
      render: (entry) => (
        <span className="text-sm text-gray-700">
          {entry.table_name ? (TABLE_LABELS[entry.table_name] ?? entry.table_name) : <span className="text-gray-400 italic">—</span>}
        </span>
      ),
    },
    {
      key: 'record_id',
      header: 'ID Enreg.',
      render: (entry) =>
        entry.record_id ? (
          <code className="text-xs text-gray-600">{entry.record_id.slice(0, 8)}…</code>
        ) : (
          <span className="text-gray-400 text-xs italic">—</span>
        ),
    },
    {
      key: 'user',
      header: 'Utilisateur',
      render: (entry) =>
        entry.user ? (
          <div>
            <p className="text-sm text-gray-900">{entry.user.full_name}</p>
            <p className="text-xs text-gray-500">@{entry.user.username}</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Système</span>
        ),
    },
    {
      key: 'action',
      header: 'Détail',
      render: (entry) => (
        <span className="block max-w-xs truncate text-sm text-gray-600">{entry.action}</span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP',
      render: (entry) =>
        entry.ip_address ? (
          <code className="text-xs text-gray-500">{entry.ip_address}</code>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Piste d'audit"
        description="Journal d'audit immuable avec vérification d'intégrité SHA-256"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Shield className={`h-4 w-4 ${verifyIntegrity.isPending ? 'animate-pulse' : ''}`} />}
              onClick={handleVerifyIntegrity}
              loading={verifyIntegrity.isPending}
            >
              Vérifier l'intégrité
            </Button>
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              loading={exporting}
            >
              Exporter CSV
            </Button>
          </div>
        }
      />
      <AdminSubNav />

      {/* Integrity result banner */}
      {verifyIntegrity.data && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              {verifyIntegrity.data.integrity_valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Chaîne d'intégrité valide —{' '}
                    {verifyIntegrity.data.verified_count ?? verifyIntegrity.data.total_records_checked} enregistrements vérifiés
                  </span>
                  {verifyIntegrity.data.details?.verification_timestamp && (
                    <span className="text-xs text-gray-400">
                      {formatDateTime(verifyIntegrity.data.details.verification_timestamp)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <span className="text-sm font-medium text-red-700">Rupture détectée dans la chaîne d'intégrité</span>
                    {verifyIntegrity.data.details?.broken_at_id && (
                      <p className="text-xs text-red-600">
                        Première rupture : <code>{verifyIntegrity.data.details.broken_at_id.slice(0, 8)}…</code>
                      </p>
                    )}
                    {verifyIntegrity.data.details?.message && (
                      <p className="text-xs text-red-600">{verifyIntegrity.data.details.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Rechercher (action, utilisateur…)"
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value || undefined, page: 1 }))}
            />
            <Select
              options={EVENT_TYPE_OPTIONS}
              value={filters.event_type || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, event_type: val || undefined, page: 1 }))
              }
              placeholder="Type d'événement"
            />
            <Select
              options={TABLE_NAME_OPTIONS}
              value={filters.table_name || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, table_name: val || undefined, page: 1 }))
              }
              placeholder="Table"
            />
            <Input
              type="date"
              label="Depuis"
              value={filters.from_timestamp || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, from_timestamp: e.target.value || undefined, page: 1 }))
              }
            />
            <Input
              type="date"
              label="Jusqu'à"
              value={filters.to_timestamp || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, to_timestamp: e.target.value || undefined, page: 1 }))
              }
            />
          </div>

          {/* Active filter count + reset */}
          {(filters.search || filters.event_type || filters.table_name || filters.from_timestamp || filters.to_timestamp) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Filtres actifs</span>
              <button
                type="button"
                onClick={() => setFilters({ page: 1, page_size: 50 })}
                className="flex items-center gap-1 rounded text-xs text-primary-600 underline hover:text-primary-800"
              >
                <RefreshCw className="h-3 w-3" /> Réinitialiser
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable<AuditEntry>
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          pagination={data?.pagination}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          rowKey={(entry) => entry.id}
          onRowClick={(entry) => setSelectedEntry(entry)}
          emptyTitle="Aucune entrée d'audit"
          emptyDescription="Aucune entrée ne correspond aux filtres sélectionnés"
        />
      </Card>

      {/* Detail modal */}
      <AuditDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}
