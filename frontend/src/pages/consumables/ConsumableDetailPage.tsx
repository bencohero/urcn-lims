import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Beaker, MapPin, Calendar, AlertTriangle, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { useConsumableById } from '@/hooks/useConsumables';
import { formatDate } from '@/lib/utils/utils';

const TYPE_LABELS: Record<string, string> = {
  REAGENT: 'Reactif',
  TUBE: 'Tube',
  PIPETTE_TIP: 'Embout pipette',
  CULTURE_MEDIA: 'Milieu de culture',
  GLOVE: 'Gant',
  SWAB: 'Ecouvillon',
};

const UNIT_LABELS: Record<string, string> = {
  VIAL: 'Flacon(s)',
  PIECE: 'Piece(s)',
  BOX: 'Boite(s)',
  PACK: 'Paquet(s)',
  BOTTLE: 'Bouteille(s)',
  KIT: 'Kit(s)',
};

export default function ConsumableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: consumable, isLoading } = useConsumableById(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!consumable) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Consommable introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/consumables')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const isExpired = new Date(consumable.expiry_date) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/consumables')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={`${consumable.manufacturer} - ${consumable.catalog_number}`}
        description={`${TYPE_LABELS[consumable.consumable_type]} - Lot: ${consumable.lot_number}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={consumable.status} />
            {consumable.hazardous && <Badge variant="danger">Dangereux</Badge>}
            <Button variant="outline" icon={<Edit2 className="h-4 w-4" />}>
              Modifier
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Informations generales
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Type" value={TYPE_LABELS[consumable.consumable_type]} />
              <InfoItem label="Fabricant" value={consumable.manufacturer} />
              <InfoItem label="Ref. catalogue" value={consumable.catalog_number} />
              <InfoItem label="N. lot" value={consumable.lot_number} />
              <InfoItem label="Quantite" value={`${consumable.quantity} ${UNIT_LABELS[consumable.unit] || consumable.unit}`} />
              {consumable.storage_conditions && (
                <InfoItem label="Conditions" value={consumable.storage_conditions} />
              )}
              {consumable.hazardous && consumable.hazard_classification && (
                <InfoItem label="Classification" value={consumable.hazard_classification} />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Date stockage" value={formatDate(consumable.storage_date)} />
              <div>
                <dt className="text-xs font-medium text-gray-500">Expiration</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  {isExpired && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  <span className={isExpired ? 'text-sm text-red-600 font-medium' : 'text-sm text-gray-900'}>
                    {formatDate(consumable.expiry_date)}
                  </span>
                </dd>
              </div>
              <InfoItem label="Cree le" value={formatDate(consumable.created_at)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Stockage
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Etude" value={consumable.study?.protocol_number || '-'} />
              <InfoItem label="Site" value={consumable.site?.name || '-'} />
              <InfoItem label="Emplacement" value={consumable.location?.name || '-'} />
              <InfoItem label="Conteneur" value={consumable.container?.name || '-'} />
            </dl>
          </CardContent>
        </Card>
      </div>
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
