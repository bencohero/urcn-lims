import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Edit2,
  MapPin,
  Phone,
  Mail,
  User,
  Layers,
  BarChart2,
  Thermometer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useSiteById, useSiteLocations, useSiteCapacity, useUpdateSite, useSiteMembers } from '@/hooks/useSites';
import type { StorageLocation } from '@/types';
import type { UpdateSiteRequest } from '@/lib/api/sites';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'CLOSED', label: 'Ferme' },
];

const LOCATION_TYPE_LABELS: Record<string, string> = {
  ROOM: 'Salle',
  ZONE: 'Zone',
  AREA: 'Espace',
};

const editSiteSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']).optional(),
  has_offline_capability: z.boolean().optional(),
  timezone: z.string().optional().or(z.literal('')),
  principal_investigator_id: z.string().uuid().optional().or(z.literal('')),
});

type EditSiteFormValues = z.infer<typeof editSiteSchema>;

function InfoItem({ label, value }: { label: string; value: string | number | null | undefined | ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function CapacityBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    clamped >= 90 ? 'bg-red-500' : clamped >= 70 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function LocationRow({ loc }: { loc: StorageLocation }) {
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">{loc.name}</span>
          <span className="text-xs text-gray-400 font-mono">{loc.code}</span>
          <span className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
            {LOCATION_TYPE_LABELS[loc.location_type] ?? loc.location_type}
          </span>
          {loc.temperature_controlled && (
            <span className="flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
              <Thermometer className="h-3 w-3" />
              Controle T°
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-4">
          {loc.items_count !== undefined && (
            <span className="text-xs text-gray-500">{loc.items_count} articles</span>
          )}
          {loc.current_usage_percent !== undefined && (
            <div className="flex-1 max-w-xs">
              <CapacityBar percent={loc.current_usage_percent} />
            </div>
          )}
        </div>
      </div>
      <div className="ml-3 flex-shrink-0">
        <StatusBadge status={loc.status} />
      </div>
    </div>
  );
}

function EditSiteForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  userOptions,
}: {
  defaultValues: EditSiteFormValues;
  onSubmit: (data: UpdateSiteRequest) => void;
  onCancel: () => void;
  loading: boolean;
  userOptions: Array<{ value: string; label: string }>;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditSiteFormValues>({
    resolver: zodResolver(editSiteSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: EditSiteFormValues) => {
    const payload: UpdateSiteRequest = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.country !== undefined) payload.country = data.country;
    if (data.city !== undefined) payload.city = data.city;
    if (data.address !== undefined) payload.address = data.address;
    if (data.postal_code !== undefined) payload.postal_code = data.postal_code;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.status) payload.status = data.status;
    if (data.has_offline_capability !== undefined)
      payload.has_offline_capability = data.has_offline_capability;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.principal_investigator_id !== undefined)
      payload.principal_investigator_id = data.principal_investigator_id || null;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Nom du site"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <Input
          label="Pays"
          error={errors.country?.message}
          {...register('country')}
        />
        <Input
          label="Ville"
          error={errors.city?.message}
          {...register('city')}
        />
        <div className="sm:col-span-2">
          <Input
            label="Adresse"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>
        <Input
          label="Code postal"
          error={errors.postal_code?.message}
          {...register('postal_code')}
        />
        <Input
          label="Fuseau horaire"
          placeholder="Europe/Paris"
          error={errors.timezone?.message}
          {...register('timezone')}
        />
        <Input
          label="Telephone"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700 mb-1.5">
            Statut
          </label>
          <select
            id="edit_status"
            {...register('status')}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.status?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="edit_pi" className="block text-sm font-medium text-gray-700 mb-1.5">
            Investigateur principal
          </label>
          <select
            id="edit_pi"
            {...register('principal_investigator_id')}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Aucun</option>
            {userOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.principal_investigator_id?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.principal_investigator_id.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="has_offline_capability"
            render={({ field }) => (
              <input
                id="edit_has_offline_capability"
                type="checkbox"
                checked={field.value ?? false}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
          />
          <label htmlFor="edit_has_offline_capability" className="text-sm text-gray-700">
            Capacite hors ligne
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: site, isLoading } = useSiteById(id!);
  const { data: locations, isLoading: locationsLoading } = useSiteLocations(id!);
  const { data: capacity, isLoading: capacityLoading } = useSiteCapacity(id!);
  const updateSite = useUpdateSite();

  const { data: membersData } = useSiteMembers(id!);

  const userOptions = useMemo(
    () => (membersData ?? []).map((m) => ({ value: m.id, label: m.name })),
    [membersData],
  );

  const handleUpdate = (payload: UpdateSiteRequest) => {
    updateSite.mutate(
      { id: id!, payload },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Site mis a jour' });
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

  if (!site) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Site introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/sites')}>
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
          onClick={() => navigate('/sites')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={site.name}
        description={`Site ${site.site_number} - ${site.country}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={site.status} />
            <Button
              variant="outline"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Modifier
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Informations de contact
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {site.address && <InfoItem label="Adresse" value={site.address} />}
              {site.postal_code && <InfoItem label="Code postal" value={site.postal_code} />}
              {site.phone && (
                <InfoItem
                  label="Telephone"
                  value={
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {site.phone}
                    </span>
                  }
                />
              )}
              {site.email && (
                <InfoItem
                  label="Email"
                  value={
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {site.email}
                    </span>
                  }
                />
              )}
              {site.timezone && <InfoItem label="Fuseau horaire" value={site.timezone} />}
              <InfoItem
                label="Mode hors ligne"
                value={
                  <span className="flex items-center gap-1">
                    {site.has_offline_capability ? (
                      <>
                        <Wifi className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-700">Disponible</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Non disponible</span>
                      </>
                    )}
                  </span>
                }
              />
            </dl>
          </CardContent>
        </Card>

        {/* Investigateur principal */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Investigateur principal
            </h3>
          </CardHeader>
          <CardContent>
            {site.principal_investigator ? (
              <dl className="grid grid-cols-1 gap-y-3">
                <InfoItem label="Nom" value={site.principal_investigator.name} />
                {site.principal_investigator.email && (
                  <InfoItem
                    label="Email"
                    value={
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {site.principal_investigator.email}
                      </span>
                    }
                  />
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun investigateur principal defini</p>
            )}
          </CardContent>
        </Card>

        {/* Emplacements de stockage */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Emplacements de stockage
                {locations && (
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    ({locations.length} emplacement{locations.length > 1 ? 's' : ''})
                  </span>
                )}
              </h3>
            </CardHeader>
            <CardContent>
              {locationsLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : !locations || locations.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Aucun emplacement de stockage configure
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {locations.map((loc) => (
                    <LocationRow key={loc.id} loc={loc} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Capacite */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Capacite du site
              </h3>
            </CardHeader>
            <CardContent>
              {capacityLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : !capacity ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Donnees de capacite non disponibles
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Global */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Utilisation globale</p>
                        <p className="text-xs text-gray-500">
                          {capacity.total_locations} emplacement{capacity.total_locations > 1 ? 's' : ''} —{' '}
                          {capacity.total_capacity_cubic_meters?.toLocaleString('fr-FR') ?? '0'} m³ total
                        </p>
                      </div>
                      <span
                        className={`text-2xl font-bold ${
                          capacity.current_usage_percent >= 90
                            ? 'text-red-600'
                            : capacity.current_usage_percent >= 70
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {capacity.current_usage_percent.toFixed(1)}%
                      </span>
                    </div>
                    <CapacityBar percent={capacity.current_usage_percent} />
                  </div>

                  {/* Par emplacement */}
                  {capacity.locations && capacity.locations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        Detail par emplacement
                      </p>
                      <div className="space-y-3">
                        {capacity.locations.map((loc) => (
                          <div key={loc.id} className="flex items-center gap-4">
                            <div className="w-32 flex-shrink-0">
                              <p className="text-sm text-gray-700 truncate" title={loc.name}>
                                {loc.name}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">{loc.code}</p>
                            </div>
                            <div className="flex-1">
                              <CapacityBar
                                percent={loc.current_usage_percent}
                                label={loc.capacity_cubic_meters ? `${loc.capacity_cubic_meters.toLocaleString('fr-FR')} m³` : undefined}
                              />
                            </div>
                            <div className="w-16 text-right flex-shrink-0">
                              <StatusBadge status={loc.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Modifier le site"
        description="Mettez a jour les informations du site"
      >
        <EditSiteForm
          defaultValues={{
            name: site.name,
            country: site.country,
            city: site.city,
            address: site.address,
            postal_code: site.postal_code,
            phone: site.phone,
            email: site.email,
            status: site.status,
            has_offline_capability: site.has_offline_capability,
            timezone: site.timezone,
            principal_investigator_id: site.principal_investigator?.id ?? '',
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          loading={updateSite.isPending}
          userOptions={userOptions}
        />
      </Modal>
    </div>
  );
}
