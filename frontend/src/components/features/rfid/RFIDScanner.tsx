import { useState } from 'react';
import { Radio, Scan, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ReadTagResponse } from '@/types';

interface RFIDScannerProps {
  onScan: (epc: string) => Promise<ReadTagResponse>;
  loading?: boolean;
}

export function RFIDScanner({ onScan, loading }: RFIDScannerProps) {
  const [epc, setEpc] = useState('');
  const [result, setResult] = useState<ReadTagResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!epc.trim()) return;
    setError(null);
    setResult(null);

    try {
      const data = await onScan(epc.trim());
      setResult(data);
    } catch {
      setError('Tag non trouve ou erreur de lecture');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Lecture de tag
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Entrez ou scannez l'EPC du tag..."
              iconLeft={<Radio className="h-4 w-4" />}
              value={epc}
              onChange={(e) => setEpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1"
            />
            <Button onClick={handleScan} loading={loading}>
              <Scan className="h-4 w-4 mr-2" />
              Lire
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Resultat de lecture
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Tag</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs text-gray-500">EPC</dt>
                    <dd className="font-mono text-sm">{result.tag.epc}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Statut</dt>
                    <dd><StatusBadge status={result.tag.status} /></dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Article associe</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs text-gray-500">Type</dt>
                    <dd className="text-sm">{result.item.type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Description</dt>
                    <dd className="text-sm">{result.item.description}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Emplacement</dt>
                    <dd className="text-sm">
                      {result.item.location.location} / {result.item.location.container}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
