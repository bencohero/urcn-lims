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
  Move,
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
import { Checkbox } from '@/components/ui/Checkbox';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { useDocumentById, useDocumentHistory, useUpdateDocument } from '@/hooks/useDocuments';
import { useStorageLocations, useContainersByLocation } from '@/hooks/useStorage';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import { useState } from 'react';
import type { AuditEntry, UpdateDocumentRequest } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  CONSENT: 'Consentement',
  CRF: 'CRF',
  SOURCE_DOC: 'Document source',
  LAB_REPORT: 'Rapport laboratoire',
  OTHER: 'Autre',
};

const CONDITION_LABELS: Record<string, string> = {
  GOOD: 'Bon',
  FAIR: 'Correct',
  DAMAGED: 'Endommage',
};

const CONFIDENTIALITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Eleve',
  CRITICAL: 'Critique',
};

const PHYSICAL_CONDITIONS = [
  { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' },
  { value: 'DAMAGED', label: 'Endommage' },
];

const CONFIDENTIALITY_OPTIONS = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'HIGH', label: 'Eleve' },
  { value: 'CRITICAL', label: 'Critique' },
];

const STATUS_OPTIONS = [
  { value: 'IN_STORAGE', label: 'En stock' },
  { value: 'CHECKED_OUT', label: 'Sorti' },
  { value: 'IN_TRANSIT', label: 'En transit' },
  { value: 'ARCHIVED', label: 'Archive' },
  { value: 'DESTROYED', label: 'Detruit' },
];

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Entree',
  OUT: 'Sortie',
  TRANSFER: 'Transfert',
  RETURN: 'Retour',
  ARCHIVE: 'Archivage',
  DESTROY: 'Destruction',
};

type EditFields = {
  container_id: string;
  physical_condition: string;
  location_notes: string;
  description: string;
  confidentiality_level: string;
  status: string;
  subject_id: string;
  visit_number: string;
  form_name: string;
  version: string;
  page_count: string;
  signature_required: boolean;
  signed_date: string;
  retention_category: string;
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLocationId, setEditLocationId] = useState('');
  const [editFields, setEditFields] = useState<EditFields>({
    container_id: '',
    physical_condition: '',
    location_notes: '',
    description: '',
    confidentiality_level: '',
    status: '',
    subject_id: '',
    visit_number: '',
    form_name: '',
    version: '',
    page_count: '',
    signature_required: false,
    signed_date: '',
    retention_category: '',
  });

  const { data: doc, isLoading } = useDocumentById(id!);
  const { data: history, isLoading: historyLoading } = useDocumentHistory(id!);
  const updateDocument = useUpdateDocument();

  const { data: locationsData } = useStorageLocations(
    showEditModal && doc?.site_id ? { site_id: doc.site_id, page_size: 100 } : undefined,
  );
  const { data: containersData } = useContainersByLocation(
    showEditModal ? editLocationId || undefined : undefined,
  );

  const locationOptions = (locationsData?.items ?? []).map((l) => ({
    value: l.id,
    label: l.name,
  }));
  const containerOptions = (containersData?.items ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const openEditModal = () => {
    setEditLocationId('');
    setEditFields({
      container_id: doc?.container_id || '',
      physical_condition: doc?.physical_condition || 'GOOD',
      location_notes: doc?.location_notes || '',
      description: doc?.description || '',
      confidentiality_level: doc?.confidentiality_level || 'HIGH',
      status: doc?.status || '',
      subject_id: doc?.subject_id || '',
      visit_number: doc?.visit_number || '',
      form_name: doc?.form_name || '',
      version: doc?.version || '',
      page_count: doc?.page_count != null ? String(doc.page_count) : '',
      signature_required: doc?.signature_required ?? false,
      signed_date: doc?.signed_date || '',
      retention_category: doc?.retention_category || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!doc) return;
    const payload: UpdateDocumentRequest = {};

    if (editFields.physical_condition && editFields.physical_condition !== doc.physical_condition)
      payload.physical_condition = editFields.physical_condition as UpdateDocumentRequest['physical_condition'];
    if (editFields.location_notes !== (doc.location_notes ?? ''))
      payload.location_notes = editFields.location_notes;
    if (editFields.description !== (doc.description ?? ''))
      payload.description = editFields.description;
    if (editFields.confidentiality_level && editFields.confidentiality_level !== doc.confidentiality_level)
      payload.confidentiality_level = editFields.confidentiality_level as UpdateDocumentRequest['confidentiality_level'];
    if (editFields.status && editFields.status !== doc.status)
      payload.status = editFields.status as UpdateDocumentRequest['status'];
    if (editFields.container_id && editFields.container_id !== (doc.container_id ?? ''))
      payload.container_id = editFields.container_id;
    if (editFields.subject_id !== (doc.subject_id ?? ''))
      payload.subject_id = editFields.subject_id;
    if (editFields.visit_number !== (doc.visit_number ?? ''))
      payload.visit_number = editFields.visit_number;
    if (editFields.form_name !== (doc.form_name ?? ''))
      payload.form_name = editFields.form_name;
    if (editFields.version !== (doc.version ?? ''))
      payload.version = editFields.version;
    const parsedPages = editFields.page_count ? Number(editFields.page_count) : undefined;
    if (parsedPages !== doc.page_count)
      payload.page_count = parsedPages;
    if (editFields.signature_required !== doc.signature_required)
      payload.signature_required = editFields.signature_required;
    if (editFields.signed_date !== (doc.signed_date ?? ''))
      payload.signed_date = editFields.signed_date || undefined;
    if (editFields.retention_category !== (doc.retention_category ?? ''))
      payload.retention_category = editFields.retention_category;

    if (Object.keys(payload).length === 0) {
      setShowEditModal(false);
      return;
    }

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Document introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/documents')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const historyEntries = history as AuditEntry[] | undefined;
  const movementsCount = doc.movements?.length ?? 0;

  const tabs = [
    { value: 'info', label: 'Informations' },
    { value: 'movements', label: 'Mouvements', count: movementsCount },
    { value: 'history', label: 'Historique', count: historyEntries?.length },
  ];

  const typeLabel = TYPE_LABELS[doc.document_type] ?? doc.document_type;
  const pageTitle = doc.internal_code || `Document ${doc.id.slice(0, 8)}`;
  const pageDesc = doc.subject_id
    ? `${typeLabel} — Sujet ${doc.subject_id}`
    : typeLabel;

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
        title={pageTitle}
        description={pageDesc}
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
        {/* ── Informations tab ── */}
        <TabContent value="info" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* General Info */}
            <Card>
              <CardHeader>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FileText className="h-4 w-4" />
                  Informations generales
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Type" value={typeLabel} />
                  <InfoItem label="Sujet" value={doc.subject_id} />
                  <InfoItem label="Visite" value={doc.visit_number} />
                  <InfoItem label="Formulaire" value={doc.form_name} />
                  <InfoItem label="Version" value={doc.version} />
                  <InfoItem label="Pages" value={doc.page_count} />
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
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4" />
                  Stockage
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Etude" value={doc.study?.protocol_number} />
                  <InfoItem label="Site" value={doc.site?.name} />
                  <InfoItem label="Emplacement" value={doc.location?.name} />
                  <InfoItem label="Conteneur" value={doc.container?.name} />
                  {doc.location_notes && (
                    <InfoItem label="Notes" value={doc.location_notes} />
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Dates & Retention */}
            <Card>
              <CardHeader>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Calendar className="h-4 w-4" />
                  Dates & Retention
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Date stockage" value={formatDate(doc.storage_date)} />
                  <InfoItem label="Retention jusqu'au" value={doc.expected_retention_until ? formatDate(doc.expected_retention_until) : undefined} />
                  <InfoItem label="Categorie" value={doc.retention_category} />
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
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Shield className="h-4 w-4" />
                  Classification
                </h3>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem
                    label="Confidentialite"
                    value={CONFIDENTIALITY_LABELS[doc.confidentiality_level] ?? doc.confidentiality_level}
                  />
                  <InfoItem
                    label="Etat physique"
                    value={doc.physical_condition ? CONDITION_LABELS[doc.physical_condition] : undefined}
                  />
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

        {/* ── Movements tab ── */}
        <TabContent value="movements" className="mt-6">
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Move className="h-4 w-4" />
                Historique des mouvements
              </h3>
            </CardHeader>
            <CardContent>
              {movementsCount === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">Aucun mouvement enregistre</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(doc.movements ?? []).map((mv) => (
                    <div key={mv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Badge variant={mv.movement_type === 'OUT' ? 'danger' : mv.movement_type === 'IN' || mv.movement_type === 'RETURN' ? 'success' : 'info'}>
                          {MOVEMENT_TYPE_LABELS[mv.movement_type] ?? mv.movement_type}
                        </Badge>
                        <span className="text-sm text-gray-700">{mv.reason || mv.notes || '—'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(mv.movement_date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabContent>

        {/* ── History tab ── */}
        <TabContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <History className="h-4 w-4" />
                Historique des modifications
              </h3>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : historyEntries?.length ? (
                <div className="divide-y divide-gray-100">
                  {historyEntries.map((entry) => (
                    <HistoryEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">Aucun historique disponible</p>
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
        description="Modifiez les informations du document"
        size="lg"
      >
        <div className="space-y-5">
          {/* Statut & Conteneur */}
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Stockage</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Statut"
                options={STATUS_OPTIONS}
                value={editFields.status}
                onValueChange={(val) => setEditFields((prev) => ({ ...prev, status: val }))}
              />
              <Select
                label="Etat physique"
                options={PHYSICAL_CONDITIONS}
                value={editFields.physical_condition}
                onValueChange={(val) => setEditFields((prev) => ({ ...prev, physical_condition: val }))}
              />
              <Select
                label="Emplacement (pour changer de conteneur)"
                options={locationOptions}
                value={editLocationId}
                onValueChange={(val) => {
                  setEditLocationId(val);
                  setEditFields((prev) => ({ ...prev, container_id: '' }));
                }}
                placeholder="Selectionner un emplacement..."
              />
              <Select
                label="Conteneur"
                options={containerOptions}
                value={editFields.container_id}
                onValueChange={(val) => setEditFields((prev) => ({ ...prev, container_id: val }))}
                placeholder={editLocationId ? 'Selectionner un conteneur...' : "Selectionnez d'abord un emplacement"}
                disabled={!editLocationId}
              />
              {doc.container && !editLocationId && (
                <p className="col-span-2 text-xs text-gray-500">
                  Conteneur actuel : <span className="font-medium">{doc.container.name}</span>
                </p>
              )}
              <Input
                label="Notes d'emplacement"
                placeholder="Ex: Etagere 3, boite rouge"
                value={editFields.location_notes}
                onChange={(e) => setEditFields((prev) => ({ ...prev, location_notes: e.target.value }))}
              />
            </div>
          </fieldset>

          {/* Identification document */}
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Identification</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="ID Sujet"
                value={editFields.subject_id}
                onChange={(e) => setEditFields((prev) => ({ ...prev, subject_id: e.target.value }))}
              />
              <Input
                label="Numero de visite"
                value={editFields.visit_number}
                onChange={(e) => setEditFields((prev) => ({ ...prev, visit_number: e.target.value }))}
              />
              <Input
                label="Nom du formulaire"
                value={editFields.form_name}
                onChange={(e) => setEditFields((prev) => ({ ...prev, form_name: e.target.value }))}
              />
              <Input
                label="Version"
                value={editFields.version}
                onChange={(e) => setEditFields((prev) => ({ ...prev, version: e.target.value }))}
              />
              <Input
                label="Nombre de pages"
                type="number"
                min={1}
                value={editFields.page_count}
                onChange={(e) => setEditFields((prev) => ({ ...prev, page_count: e.target.value }))}
              />
              <Select
                label="Confidentialite"
                options={CONFIDENTIALITY_OPTIONS}
                value={editFields.confidentiality_level}
                onValueChange={(val) => setEditFields((prev) => ({ ...prev, confidentiality_level: val }))}
              />
              <Input
                label="Categorie de retention"
                value={editFields.retention_category}
                onChange={(e) => setEditFields((prev) => ({ ...prev, retention_category: e.target.value }))}
              />
            </div>
            <div className="mt-4 space-y-3">
              <Checkbox
                label="Signature requise"
                checked={editFields.signature_required}
                onCheckedChange={(checked) => setEditFields((prev) => ({ ...prev, signature_required: checked === true }))}
              />
              {editFields.signature_required && (
                <Input
                  label="Date de signature"
                  type="date"
                  value={editFields.signed_date}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, signed_date: e.target.value }))}
                />
              )}
            </div>
          </fieldset>

          {/* Description */}
          <Input
            label="Description"
            placeholder="Description du document"
            value={editFields.description}
            onChange={(e) => setEditFields((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
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

function InfoItem({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value != null ? String(value) : '—'}</dd>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  CREATE: 'Creation',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
};

const FIELD_LABELS: Record<string, string> = {
  container_id: 'Conteneur',
  physical_condition: 'Etat physique',
  location_notes: 'Notes emplacement',
  description: 'Description',
  confidentiality_level: 'Confidentialite',
  status: 'Statut',
  document_type: 'Type',
  subject_id: 'Sujet',
  visit_number: 'Visite',
  form_name: 'Formulaire',
  version: 'Version',
  page_count: 'Pages',
  signature_required: 'Signature requise',
  signed_date: 'Date signature',
  storage_date: 'Date stockage',
  expected_retention_until: 'Retention',
  retention_category: 'Categorie retention',
};

function HistoryEntry({ entry }: { entry: AuditEntry }) {
  const changedFields = entry.new_values ? Object.keys(entry.new_values) : [];
  const variantMap: Record<string, 'success' | 'danger' | 'info'> = {
    CREATE: 'success',
    DELETE: 'danger',
    UPDATE: 'info',
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <History className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {entry.user?.full_name ?? entry.user?.username ?? 'Utilisateur inconnu'}
            </span>
            <Badge variant={variantMap[entry.event_type] ?? 'info'}>
              {EVENT_LABELS[entry.event_type] ?? entry.event_type}
            </Badge>
            <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
          </div>

          {changedFields.length > 0 && (
            <div className="mt-2 space-y-1">
              {changedFields.map((field) => {
                const oldVal = entry.old_values?.[field];
                const newVal = entry.new_values?.[field];
                const label = FIELD_LABELS[field] ?? field;
                return (
                  <div key={field} className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                    <span className="font-medium text-gray-700">{label} :</span>
                    {oldVal !== undefined && oldVal !== null && (
                      <>
                        <span className="text-gray-400 line-through">{String(oldVal)}</span>
                        <span className="text-gray-400">→</span>
                      </>
                    )}
                    <span className="text-gray-900">
                      {newVal !== null && newVal !== undefined ? String(newVal) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
