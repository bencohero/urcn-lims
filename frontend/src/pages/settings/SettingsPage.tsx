import { Sliders, Bell, Info, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_KEYS = {
  PAGE_SIZE: 'settings.pageSize',
  NOTIFY_EXPIRY: 'settings.notifyExpiry',
  NOTIFY_CALIBRATION: 'settings.notifyCalibration',
  NOTIFY_SOUND: 'settings.notifySound',
} as const;

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 lignes' },
  { value: 25, label: '25 lignes' },
  { value: 50, label: '50 lignes' },
  { value: 100, label: '100 lignes' },
];

// ─── Toggle switch component ──────────────────────────────────────────────────

interface ToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 py-2"
    >
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
        )}
      </div>
      <div className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-primary-600 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [pageSize, setPageSize] = useLocalStorage<number>(SETTINGS_KEYS.PAGE_SIZE, 25);
  const [notifyExpiry, setNotifyExpiry] = useLocalStorage<boolean>(
    SETTINGS_KEYS.NOTIFY_EXPIRY,
    true,
  );
  const [notifyCalibration, setNotifyCalibration] = useLocalStorage<boolean>(
    SETTINGS_KEYS.NOTIFY_CALIBRATION,
    true,
  );
  const [notifySound, setNotifySound] = useLocalStorage<boolean>(
    SETTINGS_KEYS.NOTIFY_SOUND,
    false,
  );

  const handleClearCache = () => {
    Object.values(SETTINGS_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configurez vos préférences d'affichage et de notification"
      />

      {/* ── Affichage ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Affichage
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lignes par page */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label
                htmlFor="pageSize"
                className="block text-sm font-medium text-gray-900"
              >
                Lignes par page
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Nombre d'éléments affichés dans les tableaux
              </p>
            </div>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="mt-1 sm:mt-0 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 transition-colors"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Langue (display only) */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-900"
              >
                Langue
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                La langue de l'interface
              </p>
            </div>
            <select
              id="language"
              value="fr"
              disabled
              className="mt-1 sm:mt-0 h-10 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
            >
              <option value="fr">Français</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <Toggle
            id="notifyExpiry"
            label="Alertes d'expiration"
            description="Recevoir une notification lorsqu'un consommable approche de sa date d'expiration"
            checked={notifyExpiry}
            onChange={setNotifyExpiry}
          />
          <Toggle
            id="notifyCalibration"
            label="Alertes de calibration"
            description="Recevoir une notification lorsqu'un équipement doit être calibré"
            checked={notifyCalibration}
            onChange={setNotifyCalibration}
          />
          <Toggle
            id="notifySound"
            label="Alertes sonores"
            description="Jouer un son lors de la réception d'une notification"
            checked={notifySound}
            onChange={setNotifySound}
          />
        </CardContent>
      </Card>

      {/* ── À propos ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Info className="h-4 w-4" />
            À propos
          </h2>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="text-sm text-gray-900 font-mono">1.0.0</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-gray-500">Stack technique</dt>
              <dd className="text-sm text-gray-900">React 18 + FastAPI</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
              <div>
                <p className="text-sm font-medium text-gray-900">Vider le cache</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Réinitialise tous les paramètres enregistrés localement
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleClearCache}
              >
                Vider
              </Button>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
