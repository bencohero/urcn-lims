import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdminSubNav } from '@/components/features/admin/AdminSubNav';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import type { SystemSetting } from '@/lib/api/systemSettings';

const TABS = [
  { value: 'SECURITY', label: 'Securite' },
  { value: 'NOTIFICATIONS', label: 'Notifications' },
  { value: 'WORKFLOW', label: 'Workflows' },
  { value: 'RFID', label: 'RFID' },
  { value: 'STORAGE', label: 'Stockage' },
];

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: SystemSetting;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const label = setting.setting_key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (setting.data_type === 'BOOLEAN') {
    return (
      <Switch
        label={label}
        checked={Boolean(value)}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={!setting.is_editable}
      />
    );
  }

  return (
    <Input
      label={label}
      type={setting.data_type === 'INTEGER' || setting.data_type === 'FLOAT' ? 'number' : 'text'}
      value={value as string | number}
      onChange={(e) =>
        onChange(
          setting.data_type === 'INTEGER'
            ? parseInt(e.target.value)
            : setting.data_type === 'FLOAT'
            ? parseFloat(e.target.value)
            : e.target.value,
        )
      }
      disabled={!setting.is_editable}
    />
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();

  // Local edits: { [id]: newValue }
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState('SECURITY');

  // Reset edits when settings reload
  useEffect(() => {
    setEdits({});
  }, [settings]);

  const grouped = (settings ?? []).reduce<Record<string, SystemSetting[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] ?? []).push(s);
    return acc;
  }, {});

  const handleSave = async () => {
    const changed = Object.entries(edits);
    if (changed.length === 0) {
      toast({ variant: 'info', title: 'Aucune modification' });
      return;
    }

    try {
      await Promise.all(
        changed.map(([id, value]) => updateSetting.mutateAsync({ id, value })),
      );
      toast({ variant: 'success', title: `${changed.length} parametre(s) enregistre(s)` });
      setEdits({});
    } catch {
      toast({ variant: 'error', title: 'Erreur lors de la sauvegarde' });
    }
  };

  const tabsWithData = TABS.filter((t) => grouped[t.value]?.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parametres"
        description="Configuration systeme et securite"
        actions={
          <Button
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            loading={updateSetting.isPending}
            disabled={Object.keys(edits).length === 0}
          >
            Enregistrer les modifications
          </Button>
        }
      />
      <AdminSubNav />

      {isLoading ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-gray-500">Chargement...</p></CardContent></Card>
      ) : (
        <Tabs
          tabs={tabsWithData.length ? tabsWithData : TABS}
          value={activeTab}
          onValueChange={setActiveTab}
        >
          {TABS.map((tab) => (
            <TabContent key={tab.value} value={tab.value} className="mt-6">
              {grouped[tab.value]?.length ? (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-gray-900">{tab.label}</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {grouped[tab.value].map((s) => (
                      <SettingField
                        key={s.id}
                        setting={s}
                        value={s.id in edits ? edits[s.id] : s.setting_value}
                        onChange={(val) => setEdits((prev) => ({ ...prev, [s.id]: val }))}
                      />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <p className="py-8 text-center text-sm text-gray-500">
                      Aucun parametre dans cette categorie
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
