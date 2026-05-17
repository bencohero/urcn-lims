import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  FileText,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { reportsApi } from '@/lib/api/reports';
import type {
  CreateScheduledReportRequest,
  UpdateScheduledReportRequest,
} from '@/lib/api/reports';
import type { ReportType, ReportFormat, ScheduledReport } from '@/types';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'inventory', label: 'Inventaire', description: 'Liste complete de tous les articles stockes' },
  { value: 'movements', label: 'Mouvements', description: 'Historique des entrees/sorties/transferts' },
  { value: 'access-requests', label: 'Demandes d\'acces', description: 'Rapport des demandes et approbations' },
  { value: 'audit-trail', label: 'Piste d\'audit', description: 'Journal d\'audit complet' },
  { value: 'statistics', label: 'Statistiques', description: 'Indicateurs et metriques cles' },
];

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  inventory: 'Inventaire',
  movements: 'Mouvements',
  'access-requests': 'Demandes d\'acces',
  'audit-trail': 'Piste d\'audit',
  statistics: 'Statistiques',
};

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

const TABS = [
  { value: 'generation', label: 'Generation' },
  { value: 'planifies', label: 'Planifies' },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Jamais';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNextRun(dateStr?: string): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ScheduledReportFormState {
  report_type: ReportType;
  format: ReportFormat;
  schedule: string;
  recipients: string;
  is_active: boolean;
}

const EMPTY_FORM: ScheduledReportFormState = {
  report_type: 'inventory',
  format: 'pdf',
  schedule: '',
  recipients: '',
  is_active: true,
};

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Generation tab state ---
  const [selectedType, setSelectedType] = useState<ReportType>('inventory');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState('generation');

  // --- Scheduled reports modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [formState, setFormState] = useState<ScheduledReportFormState>(EMPTY_FORM);

  // --- Data fetching ---
  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: reportsApi.getScheduled,
  });

  const scheduledReports: ScheduledReport[] = scheduledData?.items ?? [];

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (payload: CreateScheduledReportRequest) => reportsApi.schedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setModalOpen(false);
      toast({ variant: 'success', title: 'Rapport planifie cree' });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Erreur lors de la creation' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateScheduledReportRequest }) =>
      reportsApi.updateSchedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setModalOpen(false);
      toast({ variant: 'success', title: 'Rapport planifie mis a jour' });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Erreur lors de la mise a jour' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({ variant: 'success', title: 'Rapport planifie supprime' });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Erreur lors de la suppression' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      reportsApi.updateSchedule(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Erreur lors du changement de statut' });
    },
  });

  // --- Generation handlers ---
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const report = await reportsApi.generate(selectedType, {
        format,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      toast({
        variant: 'success',
        title: 'Rapport genere',
        description: 'Le telechargement va commencer',
      });

      if (report.download_url) {
        window.open(report.download_url, '_blank');
      }
    } catch {
      toast({
        variant: 'error',
        title: 'Erreur lors de la generation',
        description: 'Veuillez reessayer',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await reportsApi.download(selectedType, {
        format,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${selectedType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ variant: 'success', title: 'Rapport telecharge' });
    } catch {
      toast({ variant: 'error', title: 'Erreur lors du telechargement' });
    } finally {
      setGenerating(false);
    }
  };

  // --- Scheduled report handlers ---
  const handleOpenCreate = () => {
    setEditingReport(null);
    setFormState(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormState({
      report_type: report.report_type,
      format: report.format,
      schedule: report.schedule,
      recipients: report.recipients.join('\n'),
      is_active: report.is_active,
    });
    setModalOpen(true);
  };

  const handleDelete = (report: ScheduledReport) => {
    if (window.confirm(`Supprimer le rapport planifie "${REPORT_TYPE_LABELS[report.report_type]}" ?`)) {
      deleteMutation.mutate(report.id);
    }
  };

  const handleToggleActive = (report: ScheduledReport) => {
    toggleMutation.mutate({ id: report.id, is_active: !report.is_active });
  };

  const handleSubmit = () => {
    const recipients = formState.recipients
      .split('\n')
      .filter(Boolean)
      .map((s) => s.trim());

    if (editingReport) {
      updateMutation.mutate({
        id: editingReport.id,
        payload: {
          format: formState.format,
          schedule: formState.schedule,
          recipients,
          is_active: formState.is_active,
        },
      });
    } else {
      const payload: CreateScheduledReportRequest = {
        report_type: formState.report_type,
        format: formState.format,
        schedule: formState.schedule,
        recipients,
        filters: {},
      };
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // --- DataTable columns ---
  const formatBadgeVariant = (fmt: ReportFormat) => {
    if (fmt === 'pdf') return 'info' as const;
    if (fmt === 'excel') return 'success' as const;
    return 'default' as const;
  };

  const scheduledColumns = [
    {
      key: 'report_type',
      header: 'Type',
      render: (row: ScheduledReport) => (
        <span className="font-medium text-gray-900">
          {REPORT_TYPE_LABELS[row.report_type]}
        </span>
      ),
    },
    {
      key: 'format',
      header: 'Format',
      render: (row: ScheduledReport) => (
        <Badge variant={formatBadgeVariant(row.format)}>
          {row.format.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'schedule',
      header: 'Planification',
      render: (row: ScheduledReport) => (
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
          {row.schedule}
        </code>
      ),
    },
    {
      key: 'recipients',
      header: 'Destinataires',
      render: (row: ScheduledReport) => (
        <span className="text-gray-600">
          {row.recipients.length} adresse{row.recipients.length > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Statut',
      render: (row: ScheduledReport) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.is_active ? 'success' : 'default'}>
            {row.is_active ? 'Actif' : 'Inactif'}
          </Badge>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleToggleActive(row); }}
            className="text-xs text-gray-500 underline hover:text-gray-700"
          >
            {row.is_active ? 'Desactiver' : 'Activer'}
          </button>
        </div>
      ),
    },
    {
      key: 'last_run',
      header: 'Derniere execution',
      render: (row: ScheduledReport) => (
        <span className="text-gray-500 text-xs">{formatDate(row.last_run)}</span>
      ),
    },
    {
      key: 'next_run',
      header: 'Prochaine execution',
      render: (row: ScheduledReport) => (
        <span className="text-gray-500 text-xs">{formatNextRun(row.next_run)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: ScheduledReport) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Generation et telechargement de rapports"
      />

      <Tabs tabs={TABS} value={activeTab} onValueChange={setActiveTab}>
        {/* Tab: Generation */}
        <TabContent value="generation" className="pt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Report Type Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-medium text-gray-700">Type de rapport</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {REPORT_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setSelectedType(rt.value)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                      selectedType === rt.value
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${selectedType === rt.value ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      {rt.value === 'inventory' && <FileText className="h-5 w-5 text-primary-600" />}
                      {rt.value === 'movements' && <BarChart3 className="h-5 w-5 text-primary-600" />}
                      {rt.value === 'access-requests' && <Clock className="h-5 w-5 text-primary-600" />}
                      {rt.value === 'audit-trail' && <FileText className="h-5 w-5 text-primary-600" />}
                      {rt.value === 'statistics' && <BarChart3 className="h-5 w-5 text-primary-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{rt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Panel */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Parametres</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Format"
                  options={FORMAT_OPTIONS}
                  value={format}
                  onValueChange={(val) => setFormat(val as ReportFormat)}
                />
                <Input
                  label="Date debut"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <Input
                  label="Date fin"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <Button
                    className="w-full"
                    icon={<BarChart3 className="h-4 w-4" />}
                    onClick={handleGenerate}
                    loading={generating}
                  >
                    Generer le rapport
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    icon={<Download className="h-4 w-4" />}
                    onClick={handleDownload}
                    loading={generating}
                  >
                    Telecharger directement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* Tab: Planifies */}
        <TabContent value="planifies" className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Rapports planifies</h2>
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={handleOpenCreate}
              >
                Nouveau rapport planifie
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <DataTable<ScheduledReport>
                  columns={scheduledColumns}
                  data={scheduledReports}
                  loading={scheduledLoading}
                  rowKey={(row) => row.id}
                  emptyTitle="Aucun rapport planifie"
                  emptyDescription="Creez votre premier rapport planifie en cliquant sur le bouton ci-dessus."
                  emptyAction={
                    <Button
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleOpenCreate}
                    >
                      Nouveau rapport planifie
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabContent>
      </Tabs>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingReport ? 'Modifier le rapport planifie' : 'Nouveau rapport planifie'}
        size="md"
      >
        <div className="space-y-4">
          {!editingReport && (
            <Select
              label="Type de rapport"
              options={REPORT_TYPES.map((rt) => ({ value: rt.value, label: rt.label }))}
              value={formState.report_type}
              onValueChange={(val) =>
                setFormState((prev) => ({ ...prev, report_type: val as ReportType }))
              }
            />
          )}

          <Select
            label="Format"
            options={FORMAT_OPTIONS}
            value={formState.format}
            onValueChange={(val) =>
              setFormState((prev) => ({ ...prev, format: val as ReportFormat }))
            }
          />

          <div className="space-y-1">
            <Input
              label="Planification (cron)"
              value={formState.schedule}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, schedule: e.target.value }))
              }
              placeholder="0 8 * * 1"
            />
            <p className="text-xs text-gray-500">Format cron : min heure jour mois semaine</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Destinataires
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
              value={formState.recipients}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, recipients: e.target.value }))
              }
              placeholder="email@exemple.com&#10;autre@exemple.com"
            />
            <p className="text-xs text-gray-500">Une adresse email par ligne</p>
          </div>

          {editingReport && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={formState.is_active}
                onClick={() =>
                  setFormState((prev) => ({ ...prev, is_active: !prev.is_active }))
                }
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  formState.is_active ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                    formState.is_active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {formState.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} loading={isSaving}>
              {editingReport ? 'Enregistrer' : 'Creer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
