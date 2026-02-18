import { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Tabs, TabContent } from '@/components/ui/Tabs';

interface SecuritySettings {
  min_password_length: number;
  require_uppercase: boolean;
  require_number: boolean;
  require_special_char: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  access_token_minutes: number;
  refresh_token_days: number;
}

interface SystemSettingsProps {
  settings: SecuritySettings;
  onSave: (settings: SecuritySettings) => void;
  loading?: boolean;
}

export function SystemSettings({ settings: initialSettings, onSave, loading }: SystemSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState('security');

  const tabs = [
    { value: 'security', label: 'Securite' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'workflows', label: 'Workflows' },
    { value: 'rfid', label: 'RFID' },
  ];

  const update = (key: keyof SecuritySettings, value: number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab}>
        <TabContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Politique de mots de passe</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Longueur minimale"
                type="number"
                value={settings.min_password_length}
                onChange={(e) => update('min_password_length', parseInt(e.target.value))}
              />
              <Switch
                label="Exiger une majuscule"
                checked={settings.require_uppercase}
                onCheckedChange={(c) => update('require_uppercase', c === true)}
              />
              <Switch
                label="Exiger un chiffre"
                checked={settings.require_number}
                onCheckedChange={(c) => update('require_number', c === true)}
              />
              <Switch
                label="Exiger un caractere special"
                checked={settings.require_special_char}
                onCheckedChange={(c) => update('require_special_char', c === true)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Sessions</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Timeout d'inactivite (minutes)"
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => update('session_timeout_minutes', parseInt(e.target.value))}
              />
              <Input
                label="Duree token d'acces (minutes)"
                type="number"
                value={settings.access_token_minutes}
                onChange={(e) => update('access_token_minutes', parseInt(e.target.value))}
              />
              <Input
                label="Duree token de rafraichissement (jours)"
                type="number"
                value={settings.refresh_token_days}
                onChange={(e) => update('refresh_token_days', parseInt(e.target.value))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Verrouillage de compte</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Tentatives max avant verrouillage"
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) => update('max_login_attempts', parseInt(e.target.value))}
              />
              <Input
                label="Duree du verrouillage (minutes)"
                type="number"
                value={settings.lockout_duration_minutes}
                onChange={(e) => update('lockout_duration_minutes', parseInt(e.target.value))}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button icon={<Save className="h-4 w-4" />} onClick={() => onSave(settings)} loading={loading}>
              Enregistrer les modifications
            </Button>
          </div>
        </TabContent>

        <TabContent value="notifications" className="mt-6">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 py-8 text-center">
                Configuration des notifications - A venir
              </p>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="workflows" className="mt-6">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 py-8 text-center">
                Configuration des workflows - A venir
              </p>
            </CardContent>
          </Card>
        </TabContent>

        <TabContent value="rfid" className="mt-6">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 py-8 text-center">
                Configuration RFID - A venir
              </p>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>
    </div>
  );
}
