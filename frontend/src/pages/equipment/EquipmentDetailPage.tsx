import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Microscope, MapPin, Calendar, Wrench, Tag, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEquipmentById } from '@/hooks/useEquipment';
import { formatDate } from '@/lib/utils/utils';

const TYPE_LABELS: Record<string, string> = {
  CENTRIFUGE: 'Centrifugeuse',
  REFRIGERATOR: 'Refrigerateur',
  FREEZER: 'Congelateur',
  INCUBATOR: 'Incubateur',
  MICROSCOPE: 'Microscope',
  BALANCE: 'Balance',
  PH_METER: 'pH-metre',
};

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: eq, isLoading } = useEquipmentById(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Equipement introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/equipment')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/equipment')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={`${eq.manufacturer} ${eq.model}`}
        description={`${TYPE_LABELS[eq.equipment_type]} - N/S: ${eq.serial_number}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={eq.operational_status} />
            <StatusBadge status={eq.status} />
            <Button variant="outline" icon={<Edit2 className="h-4 w-4" />}>
              Modifier
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General Info */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              Informations generales
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Type" value={TYPE_LABELS[eq.equipment_type]} />
              <InfoItem label="Fabricant" value={eq.manufacturer} />
              <InfoItem label="Modele" value={eq.model} />
              <InfoItem label="N/S" value={eq.serial_number} />
              {eq.internal_code && <InfoItem label="Code interne" value={eq.internal_code} />}
              {eq.description && <InfoItem label="Description" value={eq.description} />}
            </dl>
          </CardContent>
        </Card>

        {/* Calibration */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Calibration & Maintenance
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem
                label="Calibration requise"
                value={eq.calibration_required ? 'Oui' : 'Non'}
              />
              {eq.last_calibration_date && (
                <InfoItem label="Derniere calibration" value={formatDate(eq.last_calibration_date)} />
              )}
              {eq.next_calibration_date && (
                <InfoItem label="Prochaine calibration" value={formatDate(eq.next_calibration_date)} />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Stockage
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Etude" value={eq.study?.protocol_number || '-'} />
              <InfoItem label="Site" value={eq.site?.name || '-'} />
              <InfoItem label="Emplacement" value={eq.location?.name || '-'} />
              <InfoItem label="Conteneur" value={eq.container?.name || '-'} />
              {eq.rfid_tag && (
                <div className="col-span-2 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <code className="text-sm text-gray-900">{eq.rfid_tag.epc}</code>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Dates & Cost */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates & Cout
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Date stockage" value={formatDate(eq.storage_date)} />
              {eq.purchase_date && (
                <InfoItem label="Date achat" value={formatDate(eq.purchase_date)} />
              )}
              {eq.purchase_cost !== undefined && eq.purchase_cost !== null && (
                <InfoItem
                  label="Cout"
                  value={`${eq.purchase_cost.toLocaleString('fr-FR')} ${eq.currency || 'EUR'}`}
                />
              )}
              <InfoItem label="Cree le" value={formatDate(eq.created_at)} />
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
