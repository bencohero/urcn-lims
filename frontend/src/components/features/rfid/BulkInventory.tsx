import { useState } from 'react';
import { Scan, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface InventoryResult {
  total_expected: number;
  total_found: number;
  missing: Array<{ id: string; description: string; epc: string }>;
  unknown: Array<{ epc: string }>;
  read_rate: number;
}

interface BulkInventoryProps {
  locations: Array<{ value: string; label: string }>;
  onStartScan: (locationId: string) => Promise<InventoryResult>;
  onExportReport?: (result: InventoryResult) => void;
}

export function BulkInventory({ locations, onStartScan, onExportReport }: BulkInventoryProps) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<InventoryResult | null>(null);

  const handleScan = async () => {
    if (!selectedLocation) return;
    setScanning(true);
    setResult(null);

    try {
      const data = await onStartScan(selectedLocation);
      setResult(data);
    } catch {
      // Error handled by caller
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Inventaire par localisation
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Localisation"
            options={locations}
            value={selectedLocation}
            onValueChange={setSelectedLocation}
            placeholder="Selectionner une localisation"
          />
          <Button
            onClick={handleScan}
            loading={scanning}
            disabled={!selectedLocation}
            className="w-full"
          >
            <Scan className="h-4 w-4 mr-2" />
            Demarrer le scan inventaire
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Resultat de l'inventaire
              </h3>
              {onExportReport && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => onExportReport(result)}
                >
                  Exporter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-700">{result.total_found}</p>
                <p className="text-xs text-green-600">Detectes</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-2xl font-bold text-gray-700">{result.total_expected}</p>
                <p className="text-xs text-gray-600">Attendus</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-2xl font-bold text-blue-700">{result.read_rate.toFixed(1)}%</p>
                <p className="text-xs text-blue-600">Taux lecture</p>
              </div>
            </div>

            {result.missing.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Non detectes ({result.missing.length})
                </h4>
                <ul className="space-y-1">
                  {result.missing.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 rounded bg-red-50 px-3 py-1.5 text-sm">
                      <Badge variant="danger">Manquant</Badge>
                      <span className="text-gray-900">{item.description}</span>
                      <code className="text-xs text-gray-500">{item.epc}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.unknown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Tags inconnus ({result.unknown.length})
                </h4>
                <ul className="space-y-1">
                  {result.unknown.map((tag) => (
                    <li key={tag.epc} className="flex items-center gap-2 rounded bg-yellow-50 px-3 py-1.5 text-sm">
                      <Badge variant="warning">Inconnu</Badge>
                      <code className="text-gray-700">{tag.epc}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
