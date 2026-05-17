import { useState } from 'react';
import {
  Tag,
  Search,
  Scan,
  Plus,
  Radio,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { BulkInventory } from '@/components/features/rfid/BulkInventory';
import { useRFIDTags, useReadTag, useEncodeTag } from '@/hooks/useRFID';
import { rfidApi } from '@/lib/api/rfid';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import type { RFIDTag, RFIDFilters, ReadTagResponse } from '@/types';

const columns: Column<RFIDTag>[] = [
  {
    key: 'epc',
    header: 'EPC',
    sortable: true,
    render: (tag) => (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-gray-400" />
        <code className="font-medium text-gray-900 text-xs">{tag.epc}</code>
      </div>
    ),
  },
  {
    key: 'associated_item_type',
    header: 'Type article',
    render: (tag) => {
      const labels: Record<string, string> = {
        DOCUMENT: 'Document',
        EQUIPMENT: 'Equipement',
        CONSUMABLE: 'Consommable',
      };
      return <Badge variant="primary">{labels[tag.associated_item_type] || tag.associated_item_type}</Badge>;
    },
  },
  {
    key: 'associated_item',
    header: 'Article',
    render: (tag) => tag.associated_item?.description || tag.associated_item_id.slice(0, 8),
  },
  {
    key: 'status',
    header: 'Statut',
    render: (tag) => <StatusBadge status={tag.status} />,
  },
  {
    key: 'encoding_date',
    header: 'Encode le',
    sortable: true,
    render: (tag) => formatDate(tag.encoding_date),
  },
  {
    key: 'last_read_date',
    header: 'Derniere lecture',
    render: (tag) => tag.last_read_date ? formatDateTime(tag.last_read_date) : '-',
  },
  {
    key: 'read_count',
    header: 'Lectures',
    render: (tag) => tag.read_count ?? 0,
  },
];

// Placeholder locations — in production these would come from the storage locations API
const DEMO_LOCATIONS = [
  { value: 'loc-1', label: 'Site A - Salle de stockage principale' },
  { value: 'loc-2', label: 'Site A - Archive temperature controlee' },
  { value: 'loc-3', label: 'Site B - Laboratoire' },
];

export default function RFIDPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tags');
  const [filters, setFilters] = useState<RFIDFilters>({ page: 1, page_size: 25 });
  const [scanEpc, setScanEpc] = useState('');
  const [scanResult, setScanResult] = useState<ReadTagResponse | null>(null);
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [encodeItemId, setEncodeItemId] = useState('');
  const [encodeItemType, setEncodeItemType] = useState<'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE'>('DOCUMENT');

  const { data: tagsData, isLoading } = useRFIDTags(filters);
  const readTag = useReadTag();
  const encodeTag = useEncodeTag();

  const handleScan = () => {
    if (!scanEpc.trim()) return;
    readTag.mutate(
      { reader_id: 'web-ui', epc: scanEpc.trim() },
      {
        onSuccess: (result) => {
          setScanResult(result);
          toast({ variant: 'success', title: 'Tag lu avec succes' });
        },
        onError: () => {
          setScanResult(null);
          toast({ variant: 'error', title: 'Tag non trouve' });
        },
      },
    );
  };

  const handleEncode = () => {
    if (!encodeItemId.trim()) return;
    encodeTag.mutate(
      { associated_item_id: encodeItemId, associated_item_type: encodeItemType },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Tag encode avec succes' });
          setShowEncodeModal(false);
          setEncodeItemId('');
        },
        onError: () => toast({ variant: 'error', title: "Erreur lors de l'encodage" }),
      },
    );
  };

  const handleInventoryScan = async (locationId: string) => {
    const report = await rfidApi.getInventoryReport({ location_id: locationId });
    return {
      total_expected: report.total_expected,
      total_found: report.total_found,
      missing: report.items
        .filter((i) => i.status === 'MISSING')
        .map((i) => ({ id: i.item_id, description: i.description, epc: i.epc })),
      unknown: report.items
        .filter((i) => i.status === 'UNEXPECTED')
        .map((i) => ({ epc: i.epc })),
      read_rate: report.total_expected > 0
        ? (report.total_found / report.total_expected) * 100
        : 0,
    };
  };

  const tabs = [
    { value: 'tags', label: 'Tags RFID' },
    { value: 'scan', label: 'Scanner' },
    { value: 'inventory', label: 'Inventaire', icon: <Package className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="RFID"
        description="Gestion des tags RFID et inventaire"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowEncodeModal(true)}
          >
            Encoder un tag
          </Button>
        }
      />

      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab}>
        {/* Tags List Tab */}
        <TabContent value="tags" className="mt-6 space-y-4">
          <Card>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  placeholder="Rechercher par EPC..."
                  iconLeft={<Search className="h-4 w-4" />}
                  value={filters.search || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                />
                <Select
                  options={[
                    { value: '', label: 'Tous les types' },
                    { value: 'DOCUMENT', label: 'Document' },
                    { value: 'EQUIPMENT', label: 'Equipement' },
                    { value: 'CONSUMABLE', label: 'Consommable' },
                  ]}
                  value={filters.associated_item_type || ''}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      associated_item_type: (val || undefined) as RFIDFilters['associated_item_type'],
                      page: 1,
                    }))
                  }
                  placeholder="Type d'article"
                />
                <Select
                  options={[
                    { value: '', label: 'Tous les statuts' },
                    { value: 'ACTIVE', label: 'Actif' },
                    { value: 'INACTIVE', label: 'Inactif' },
                    { value: 'DAMAGED', label: 'Endommage' },
                    { value: 'LOST', label: 'Perdu' },
                  ]}
                  value={filters.status || ''}
                  onValueChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: (val || undefined) as RFIDFilters['status'],
                      page: 1,
                    }))
                  }
                  placeholder="Statut"
                />
              </div>
            </div>
          </Card>

          <Card>
            <DataTable
              columns={columns}
              data={tagsData?.items ?? []}
              loading={isLoading}
              pagination={tagsData?.pagination}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSort={(key) =>
                setFilters((prev) => ({
                  ...prev,
                  sort_by: key,
                  sort_order: prev.sort_by === key && prev.sort_order === 'asc' ? 'desc' : 'asc',
                }))
              }
              rowKey={(tag) => tag.id}
              emptyTitle="Aucun tag RFID"
              emptyDescription="Aucun tag RFID enregistre dans le systeme"
            />
          </Card>
        </TabContent>

        {/* Scanner Tab */}
        <TabContent value="scan" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Lecture de tag
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Entrez ou scannez l'EPC du tag..."
                  iconLeft={<Radio className="h-4 w-4" />}
                  value={scanEpc}
                  onChange={(e) => setScanEpc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="flex-1"
                />
                <Button onClick={handleScan} loading={readTag.isPending}>
                  <Scan className="h-4 w-4 mr-2" />
                  Lire
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scan Result */}
          {scanResult && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Resultat de lecture
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Tag</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs text-gray-500">EPC</dt>
                        <dd className="font-mono text-sm">{scanResult.tag.epc}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Statut</dt>
                        <dd><StatusBadge status={scanResult.tag.status} /></dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Article associe</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs text-gray-500">Type</dt>
                        <dd className="text-sm">{scanResult.item.type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Description</dt>
                        <dd className="text-sm">{scanResult.item.description}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Statut article</dt>
                        <dd className="text-sm">{scanResult.item.status}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Emplacement</dt>
                        <dd className="text-sm">
                          {scanResult.item.location.location} / {scanResult.item.location.container}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabContent>

        {/* Inventory Tab */}
        <TabContent value="inventory" className="mt-6">
          <BulkInventory
            locations={DEMO_LOCATIONS}
            onStartScan={handleInventoryScan}
            onExportReport={(result) => {
              const lines = [
                `Inventaire RFID - ${new Date().toLocaleDateString('fr-FR')}`,
                `Detectes: ${result.total_found} / ${result.total_expected} (${result.read_rate.toFixed(1)}%)`,
                '',
                'Articles manquants:',
                ...result.missing.map((i) => `  - ${i.description} (${i.epc})`),
                '',
                'Tags inconnus:',
                ...result.unknown.map((i) => `  - ${i.epc}`),
              ];
              const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventaire-rfid-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
        </TabContent>
      </Tabs>

      {/* Encode Modal */}
      <Modal
        open={showEncodeModal}
        onOpenChange={setShowEncodeModal}
        title="Encoder un tag RFID"
        description="Associer un nouveau tag RFID a un article"
      >
        <div className="space-y-4">
          <Input
            label="ID de l'article"
            placeholder="UUID de l'article a associer"
            value={encodeItemId}
            onChange={(e) => setEncodeItemId(e.target.value)}
            required
          />
          <Select
            label="Type d'article"
            options={[
              { value: 'DOCUMENT', label: 'Document' },
              { value: 'EQUIPMENT', label: 'Equipement' },
              { value: 'CONSUMABLE', label: 'Consommable' },
            ]}
            value={encodeItemType}
            onValueChange={(val) => setEncodeItemType(val as typeof encodeItemType)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEncodeModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEncode}
              loading={encodeTag.isPending}
              disabled={!encodeItemId.trim()}
            >
              Encoder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
