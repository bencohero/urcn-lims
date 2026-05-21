import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/utils';
import type { Document, DocumentFilters, DocumentType, DocumentStatus } from '@/types';
import { DocumentForm } from '@/components/features/documents/DocumentForm';

const DOCUMENT_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'CONSENT', label: 'Consentement' },
  { value: 'CRF', label: 'CRF' },
  { value: 'SOURCE_DOC', label: 'Document source' },
  { value: 'LAB_REPORT', label: 'Rapport laboratoire' },
  { value: 'OTHER', label: 'Autre' },
];

const DOCUMENT_STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'IN_STORAGE', label: 'En stock' },
  { value: 'CHECKED_OUT', label: 'Sorti' },
  { value: 'IN_TRANSIT', label: 'En transit' },
  { value: 'ARCHIVED', label: 'Archive' },
  { value: 'DESTROYED', label: 'Detruit' },
];

const TYPE_LABELS: Record<DocumentType, string> = {
  CONSENT: 'Consentement',
  CRF: 'CRF',
  SOURCE_DOC: 'Doc. source',
  LAB_REPORT: 'Rapport labo',
  OTHER: 'Autre',
};


export default function DocumentsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    page_size: 25,
  });

  const { data, isLoading } = useDocuments(filters);
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  const columns: Column<Document>[] = [
    {
      key: 'internal_code',
      header: 'Code',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{doc.internal_code || doc.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      key: 'document_type',
      header: 'Type',
      sortable: true,
      render: (doc) => (
        <Badge variant="primary">{TYPE_LABELS[doc.document_type as DocumentType] ?? doc.document_type}</Badge>
      ),
    },
    {
      key: 'subject_id',
      header: 'Sujet',
      sortable: true,
      render: (doc) => doc.subject_id ?? '—',
    },
    {
      key: 'study',
      header: 'Etude',
      render: (doc) => doc.study?.protocol_number || '—',
    },
    {
      key: 'site',
      header: 'Site',
      render: (doc) => doc.site?.name || '—',
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      render: (doc) => <StatusBadge status={doc.status} />,
    },
    {
      key: 'storage_date',
      header: 'Date stockage',
      sortable: true,
      render: (doc) => formatDate(doc.storage_date),
    },
    {
      key: 'actions',
      header: '',
      render: (doc) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Gestion des documents cliniques"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nouveau document
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Rechercher..."
              iconLeft={<Search className="h-4 w-4" />}
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            />
            <Select
              options={DOCUMENT_TYPE_OPTIONS}
              value={filters.document_type || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  document_type: (val || undefined) as DocumentType | undefined,
                  page: 1,
                }))
              }
              placeholder="Type de document"
            />
            <Select
              options={DOCUMENT_STATUS_OPTIONS}
              value={filters.status || ''}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (val || undefined) as DocumentStatus | undefined,
                  page: 1,
                }))
              }
              placeholder="Statut"
            />
            <Input
              type="text"
              placeholder="ID sujet"
              value={filters.subject_id || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subject_id: e.target.value || undefined, page: 1 }))
              }
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
          onRowClick={(doc) => navigate(`/documents/${doc.id}`)}
          rowKey={(doc) => doc.id}
          emptyTitle="Aucun document"
          emptyDescription="Aucun document ne correspond aux filtres selectionnes"
          emptyAction={
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Creer un document
            </Button>
          }
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nouveau document"
        description="Enregistrer un nouveau document dans le systeme"
        size="lg"
      >
        <DocumentForm
          onSubmit={(data) => {
            createDocument.mutate(data, {
              onSuccess: () => {
                toast({ variant: 'success', title: 'Document cree avec succes' });
                setShowCreateModal(false);
              },
              onError: () => {
                toast({ variant: 'error', title: 'Erreur lors de la creation' });
              },
            });
          }}
          onCancel={() => setShowCreateModal(false)}
          loading={createDocument.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!docToDelete}
        onOpenChange={(open) => { if (!open) setDocToDelete(null); }}
        title="Supprimer le document"
        description={`Etes-vous sur de vouloir supprimer le document "${docToDelete?.internal_code || docToDelete?.id.slice(0, 8)}" ? Cette action est irreversible.`}
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setDocToDelete(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={deleteDocument.isPending}
            onClick={() => {
              if (!docToDelete) return;
              deleteDocument.mutate(docToDelete.id, {
                onSuccess: () => {
                  toast({ variant: 'success', title: 'Document supprime' });
                  setDocToDelete(null);
                },
                onError: () => {
                  toast({ variant: 'error', title: 'Erreur lors de la suppression' });
                },
              });
            }}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
