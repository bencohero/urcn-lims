import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  Wrench,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMovementById, useRecordReturn } from '@/hooks/useMovements';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import type { BackendMovementType } from '@/lib/api/movements';

// ─── Constants ────────────────────────────────────────────────────────────────

type MovementBadgeVariant = 'danger' | 'success' | 'info' | 'warning' | 'default' | 'orange';

const MOVEMENT_TYPE_VARIANTS: Record<BackendMovementType, MovementBadgeVariant> = {
  IN: 'success',
  OUT: 'danger',
  TRANSFER: 'info',
  RETURN: 'warning',
  ARCHIVE: 'default',
  DESTROY: 'orange',
};

const MOVEMENT_TYPE_LABELS: Record<BackendMovementType, string> = {
  IN: 'Entrée',
  OUT: 'Sortie',
  TRANSFER: 'Transfert',
  RETURN: 'Retour',
  ARCHIVE: 'Archivage',
  DESTROY: 'Destruction',
};

const CONFIDENTIALITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

// ─── Helper components ────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value);
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{display}</dd>
    </div>
  );
}

function LocationBlock({
  label,
  location,
  container,
}: {
  label: string;
  location?: { id: string; name: string; code?: string } | null;
  container?: { id: string; name: string; code?: string } | null;
}) {
  const hasData = location || container;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">
        {hasData ? (
          <div className="space-y-0.5">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                {location.code ? `${location.code} – ${location.name}` : location.name}
              </span>
            )}
            {container && (
              <span className="flex items-center gap-1 text-gray-600">
                <Package className="h-3 w-3 text-gray-400" />
                {container.code ? `${container.code} – ${container.name}` : container.name}
              </span>
            )}
          </div>
        ) : (
          '—'
        )}
      </dd>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: movement, isLoading } = useMovementById(id!);
  const recordReturn = useRecordReturn();

  const handleRecordReturn = () => {
    if (!movement) return;
    recordReturn.mutate(movement.id, {
      onSuccess: () => toast({ variant: 'success', title: 'Retour enregistré avec succès' }),
      onError: () => toast({ variant: 'error', title: "Erreur lors de l'enregistrement du retour" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Mouvement introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/movements')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const item = movement.stored_item;
  const isOverdue =
    movement.is_return_overdue ??
    (movement.expected_return_date &&
      !movement.actual_return_date &&
      new Date(movement.expected_return_date) < new Date());

  const canReturn = movement.movement_type === 'OUT' && !movement.actual_return_date;

  const itemIcon =
    item?.item_type === 'DOCUMENT' ? (
      <FileText className="h-4 w-4" />
    ) : item?.item_type === 'EQUIPMENT' ? (
      <Wrench className="h-4 w-4" />
    ) : (
      <FlaskConical className="h-4 w-4" />
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/movements')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={`Mouvement — ${MOVEMENT_TYPE_LABELS[movement.movement_type]}`}
        description={`ID : ${movement.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={MOVEMENT_TYPE_VARIANTS[movement.movement_type]}>
              {MOVEMENT_TYPE_LABELS[movement.movement_type]}
            </Badge>
            {isOverdue && (
              <Badge variant="danger">
                <AlertTriangle className="h-3 w-3 mr-1 inline" />
                En retard
              </Badge>
            )}
            {movement.actual_return_date && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                Retourné
              </Badge>
            )}
            {canReturn && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRecordReturn}
                loading={recordReturn.isPending}
              >
                Enregistrer le retour
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Movement info */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Détails du mouvement
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Type" value={MOVEMENT_TYPE_LABELS[movement.movement_type]} />
              <InfoItem label="Quantité" value={movement.quantity} />
              <InfoItem label="Motif" value={movement.reason} />
              <InfoItem label="Date mouvement" value={formatDateTime(movement.movement_date)} />
              <InfoItem label="Retour prévu" value={movement.expected_return_date ? formatDate(movement.expected_return_date) : undefined} />
              <InfoItem label="Retour effectif" value={movement.actual_return_date ? formatDate(movement.actual_return_date) : undefined} />
              {movement.notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500">Notes</dt>
                  <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{movement.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Actors */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Intervenants
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Effectué par" value={movement.performed_by?.name} />
              <InfoItem label="Approuvé par" value={movement.approved_by?.name} />
              <InfoItem label="Créé le" value={formatDateTime(movement.created_at)} />
            </dl>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Trajet
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <LocationBlock
                label="Depuis"
                location={movement.from_location}
                container={movement.from_container}
              />
              <LocationBlock
                label="Vers"
                location={movement.to_location}
                container={movement.to_container}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Article */}
        {item && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {itemIcon}
                Article concerné
                <StatusBadge status={item.status} className="ml-auto" />
              </h3>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem label="Type" value={item.item_type} />
                <InfoItem label="Code interne" value={item.internal_code} />
                <InfoItem label="Description" value={item.description} />

                {/* Storage */}
                {(item.container || item.location) && (
                  <>
                    <InfoItem
                      label="Emplacement actuel"
                      value={item.location ? (item.location.code ? `${item.location.code} – ${item.location.name}` : item.location.name) : undefined}
                    />
                    <InfoItem
                      label="Conteneur actuel"
                      value={item.container ? (item.container.code ? `${item.container.code} – ${item.container.name}` : item.container.name) : undefined}
                    />
                  </>
                )}

                {/* Document-specific */}
                {item.item_type === 'DOCUMENT' && (
                  <>
                    <InfoItem label="Type document" value={item.document_type} />
                    <InfoItem label="Sujet" value={item.subject_id} />
                    <InfoItem label="Visite" value={item.visit_number} />
                    <InfoItem label="Formulaire" value={item.form_name} />
                    <InfoItem label="Version" value={item.version} />
                    <InfoItem label="Pages" value={item.page_count} />
                    <InfoItem
                      label="Confidentialité"
                      value={item.confidentiality_level ? (CONFIDENTIALITY_LABELS[item.confidentiality_level] ?? item.confidentiality_level) : undefined}
                    />
                  </>
                )}

                {/* Equipment-specific */}
                {item.item_type === 'EQUIPMENT' && (
                  <>
                    <InfoItem label="Type équipement" value={item.equipment_type} />
                    <InfoItem label="Fabricant" value={item.manufacturer} />
                    <InfoItem label="Modèle" value={item.model} />
                    <InfoItem label="N° série" value={item.serial_number} />
                    <InfoItem label="État opérationnel" value={item.operational_status} />
                  </>
                )}

                {/* Consumable-specific */}
                {item.item_type === 'CONSUMABLE' && (
                  <>
                    <InfoItem label="Type consommable" value={item.consumable_type} />
                    <InfoItem label="Fabricant" value={item.manufacturer} />
                    <InfoItem label="N° catalogue" value={item.catalog_number} />
                    <InfoItem label="N° lot" value={item.lot_number} />
                    <InfoItem
                      label="Date expiration"
                      value={item.expiry_date ? formatDate(item.expiry_date) : undefined}
                    />
                    <InfoItem label="Dangereux" value={item.hazardous} />
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Return dates — dedicated card when there's return context */}
        {(movement.expected_return_date || movement.actual_return_date) && (
          <Card className={isOverdue ? 'border-red-300 bg-red-50' : ''}>
            <CardHeader>
              <h3
                className={`text-sm font-semibold flex items-center gap-2 ${isOverdue ? 'text-red-800' : 'text-gray-900'}`}
              >
                <Calendar className="h-4 w-4" />
                Suivi du retour
              </h3>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {movement.expected_return_date && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Retour prévu</dt>
                    <dd
                      className={`mt-0.5 text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}
                    >
                      {formatDate(movement.expected_return_date)}
                    </dd>
                  </div>
                )}
                {movement.actual_return_date && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Retour effectif</dt>
                    <dd className="mt-0.5 text-sm text-green-700 font-semibold">
                      {formatDate(movement.actual_return_date)}
                    </dd>
                  </div>
                )}
                {isOverdue && !movement.actual_return_date && (
                  <div className="col-span-2">
                    <p className="text-sm text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Retour en retard — aucun retour enregistré
                    </p>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
