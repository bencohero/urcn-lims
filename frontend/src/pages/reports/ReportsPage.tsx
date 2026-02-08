import { useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { reportsApi } from '@/lib/api/reports';
import { formatDate } from '@/lib/utils/utils';
import type { ReportType, ReportFormat } from '@/types';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'inventory', label: 'Inventaire', description: 'Liste complete de tous les articles stockes' },
  { value: 'movements', label: 'Mouvements', description: 'Historique des entrees/sorties/transferts' },
  { value: 'access-requests', label: 'Demandes d\'acces', description: 'Rapport des demandes et approbations' },
  { value: 'audit-trail', label: 'Piste d\'audit', description: 'Journal d\'audit complet' },
  { value: 'statistics', label: 'Statistiques', description: 'Indicateurs et metriques cles' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<ReportType>('inventory');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generating, setGenerating] = useState(false);

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

      // Trigger download by opening the URL
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Generation et telechargement de rapports"
      />

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
    </div>
  );
}
