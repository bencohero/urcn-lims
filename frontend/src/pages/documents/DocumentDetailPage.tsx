import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  Tag,
  History,
  Shield,
  Edit2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { useDocumentById, useDocumentHistory, useUpdateDocument } from '@/hooks/useDocuments';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import { useState } from 'react';
import type { AuditEntry } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  CONSENT: 'Consentement',
  CRF: 'CRF',
  SOURCE_DOC: 'Document source',
};

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Bon',
  FAIR: 'Correct',
  POOR: 'Mauvais',
  DAMAGED: 'Endommage',
};

const PHYSICAL_CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' },
  { value: 'POOR', label: 'Mauvais' },
  { value: 'DAMAGED', label: 'Endommage' },
];

const STATUS_OPTIONS = [
  { value: 'IN_STORAGE', label: 'En stockage' },
  { value: 'CHECKED_OUT', label: 'Sorti' },
  { value: 'IN_TRANSIT', label: 'En transit' },
  { value: 'ARCHIVED', label: 'Archive' },
];

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFields, setEditFields] = useState({
    container_id: '',
    physical_condition: '',
    location_notes: '',
    status: '',
  });

  const { data: doc, isLoading } = useDocumentById(id!);
  const { data: history, isLoading: historyLoading } = useDocumentHistory(id!);
  const updateDocument = useUpdateDocument();

  const openEditModal = () => {
    setEditFields({
      container_id: '',
      physical_condition: doc?.physical_condition || '',
      location_notes: doc?.location_notes || '',
      status: doc?.status || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    const payload: Record<string, string> = {};
    if (editFields.container_id) payload.container_id = editFields.container_id;
    if (editFields.physical_condition) payload.physical_condition = editFields.physical_condition;
    if (editFields.location_notes !== doc?.location_notes) payload.location_notes = editFields.location_notes;
    if (editFields.status && editFields.status !== doc?.status) payload.status = editFields.status;

    updateDocument.mutate(
      { id: id!, payload },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Document mis a jour' });
          setShowEditModal(false);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la mise a jour' }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Document introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/documents')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const tabs = [
    { value: 'info', label: 'Informations' },
    { value: 'history', label: 'Historique', count: (history as AuditEntry[] | undefined)?.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/documents')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={doc.internal_code || `Document ${doc.id.slice(0, 8)}`}
        description={`${TYPE_LABELS[doc.document_type]} - Sujet ${doc.subject_id}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={doc.status} />
            <Button
              variant="outline"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={openEditModal}
            >
              Modifier
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab}>
        <TabContent value="info" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* General Info */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations generales
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Type" value={TYPE_LABELS[doc.document_type]} />
                  <InfoItem label="Sujet" value={doc.subject_id} />
                  <InfoItem label="Visite" value={doc.visit_number} />
                  <InfoItem label="Formulaire" value={doc.form_name} />
                  <InfoItem label="Version" value={doc.version} />
                  <InfoItem label="Pages" value={String(doc.page_count)} />
                  <InfoItem
                    label="Signature"
                    value={doc.signature_required ? 'Requise' : 'Non requise'}
                  />
                  {doc.signed_date && (
                    <InfoItem label="Date signature" value={formatDate(doc.signed_date)} />
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Stockage
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Etude" value={doc.study?.protocol_number || '-'} />
                  <InfoItem label="Site" value={doc.site?.name || '-'} />
                  <InfoItem label="Emplacement" value={doc.location?.name || '-'} />
                  <InfoItem label="Conteneur" value={doc.container?.name || '-'} />
                  {doc.location_notes && (
                    <InfoItem label="Notes" value={doc.location_notes} />
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Dates & Retention */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates & Retention
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Date stockage" value={formatDate(doc.storage_date)} />
                  <InfoItem label="Retention jusqu'au" value={formatDate(doc.expected_retention_until)} />
                  <InfoItem label="Cree le" value={formatDate(doc.created_at)} />
                  {doc.updated_at && (
                    <InfoItem label="Mis a jour" value={formatDate(doc.updated_at)} />
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Metadata
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem
                    label="Confidentialite"
                    value={doc.confidentiality_level}
                  />
                  {doc.physical_condition && (
                    <InfoItem
                      label="Etat physique"
                      value={CONDITION_LABELS[doc.physical_condition]}
                    />
                  )}
                  {doc.rfid_tag && (
                    <div className="col-span-2">
                      <dt className="text-xs font-medium text-gray-500">Tag RFID</dt>
                      <dd className="mt-0.5 flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        <code className="text-sm text-gray-900">{doc.rfid_tag.epc}</code>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        <TabContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique des modifications
              </h3>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (history as AuditEntry[] | undefined)?.length ? (
                <div className="space-y-4">
                  {(history as AuditEntry[]).map((entry) => (
                    <div key={entry.id} className="flex gap-3 border-b border-gray-50 pb-3 last:border-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <History className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{entry.user.full_name}</span>
                          {' '}a effectue une action{' '}
                          <Badge variant={entry.event_type === 'CREATE' ? 'success' : entry.event_type === 'DELETE' ? 'danger' : 'info'}>
                            {entry.event_type}
                          </Badge>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Aucun historique disponible</p>
              )}
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Modifier le document"
        description="Modifiez les informations de stockage et l'etat du document"
      >
        <div className="space-y-4">
          <Input
            label="ID Conteneur (si deplacement)"
            placeholder="UUID du nouveau conteneur"
            value={editFields.container_id}
            onChange={(e) => setEditFields((prev) => ({ ...prev, container_id: e.target.value }))}
          />
          <Select
            label="Etat physique"
            options={PHYSICAL_CONDITIONS}
            value={editFields.physical_condition}
            onValueChange={(val) => setEditFields((prev) => ({ ...prev, physical_condition: val }))}
            placeholder="Selectionner..."
          />
          <Select
            label="Statut"
            options={STATUS_OPTIONS}
            value={editFields.status}
            onValueChange={(val) => setEditFields((prev) => ({ ...prev, status: val }))}
          />
          <Input
            label="Notes d'emplacement"
            placeholder="Ex: Etagere 3, boite rouge"
            value={editFields.location_notes}
            onChange={(e) => setEditFields((prev) => ({ ...prev, location_notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubmit} loading={updateDocument.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
