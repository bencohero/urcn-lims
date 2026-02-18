import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { DocumentFilters, DocumentType, DocumentStatus } from '@/types';

const DOCUMENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'CONSENT', label: 'Consentement' },
  { value: 'CRF', label: 'CRF' },
  { value: 'SOURCE_DOC', label: 'Document source' },
  { value: 'LAB_RESULT', label: 'Resultat labo' },
  { value: 'MEDICAL_RECORD', label: 'Dossier medical' },
  { value: 'OTHER', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'IN_STORAGE', label: 'En stock' },
  { value: 'OUT', label: 'Sorti' },
  { value: 'ARCHIVED', label: 'Archive' },
];

interface DocumentsFiltersProps {
  filters: DocumentFilters;
  onChange: (filters: Partial<DocumentFilters>) => void;
}

export function DocumentsFilters({ filters, onChange }: DocumentsFiltersProps) {
  const hasActiveFilters = filters.search || filters.document_type || filters.status;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input
          placeholder="Rechercher..."
          iconLeft={<Search className="h-4 w-4" />}
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value })}
        />
        <Select
          options={DOCUMENT_TYPES}
          value={filters.document_type || ''}
          onValueChange={(val) => onChange({ document_type: (val || undefined) as DocumentType | undefined })}
          placeholder="Type"
        />
        <Select
          options={STATUS_OPTIONS}
          value={filters.status || ''}
          onValueChange={(val) => onChange({ status: (val || undefined) as DocumentStatus | undefined })}
          placeholder="Statut"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="h-4 w-4" />}
            onClick={() => onChange({ search: '', document_type: undefined, status: undefined })}
            className="self-center"
          >
            Effacer filtres
          </Button>
        )}
      </div>
    </div>
  );
}
