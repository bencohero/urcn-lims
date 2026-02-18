import { ArrowDownToLine, ArrowUpFromLine, RotateCcw, Edit2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { formatDateTime } from '@/lib/utils/utils';
import type { ReactNode } from 'react';

interface HistoryEntry {
  id: string;
  type: 'IN' | 'OUT' | 'RETURN' | 'EDIT' | 'RFID_SCAN';
  description: string;
  user_name: string;
  timestamp: string;
}

const TYPE_CONFIG: Record<string, { icon: ReactNode; color: string; label: string }> = {
  IN: { icon: <ArrowDownToLine className="h-4 w-4" />, color: 'bg-green-100 text-green-600', label: 'Entree' },
  OUT: { icon: <ArrowUpFromLine className="h-4 w-4" />, color: 'bg-red-100 text-red-600', label: 'Sortie' },
  RETURN: { icon: <RotateCcw className="h-4 w-4" />, color: 'bg-blue-100 text-blue-600', label: 'Retour' },
  EDIT: { icon: <Edit2 className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600', label: 'Modification' },
  RFID_SCAN: { icon: <Tag className="h-4 w-4" />, color: 'bg-purple-100 text-purple-600', label: 'Scan RFID' },
};

interface DocumentHistoryProps {
  entries: HistoryEntry[];
}

export function DocumentHistory({ entries }: DocumentHistoryProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Aucun historique</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-0">
        {entries.map((entry) => {
          const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.EDIT;
          return (
            <div key={entry.id} className="relative flex items-start gap-4 py-3 pl-2">
              <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
                {config.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">{config.label}</span>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-900">{entry.description}</p>
                <p className="text-xs text-gray-500">Par {entry.user_name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
