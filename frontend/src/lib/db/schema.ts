import Dexie, { type Table } from 'dexie';

export interface CachedDocument {
  id: string;
  subject_id: string;
  document_type: string;
  study_id: string;
  site_id: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CachedEquipment {
  id: string;
  serial_number: string;
  equipment_type: string;
  site_id: string;
  operational_status: string;
  created_at: string;
  updated_at: string;
}

export interface CachedConsumable {
  id: string;
  lot_number: string;
  consumable_type: string;
  site_id: string;
  expiry_date: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CachedAccessRequest {
  id: string;
  request_number: string;
  requester_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OfflinePendingAction {
  id?: number;
  type: string;
  action: string;
  data: string; // JSON serialized
  timestamp: string;
  retries: number;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

class ClinicalStorageDB extends Dexie {
  documents!: Table<CachedDocument, string>;
  equipment!: Table<CachedEquipment, string>;
  consumables!: Table<CachedConsumable, string>;
  accessRequests!: Table<CachedAccessRequest, string>;
  pendingActions!: Table<OfflinePendingAction, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super('ClinicalStorageDB');

    this.version(1).stores({
      documents: 'id, subject_id, study_id, site_id, document_type, status, created_at',
      equipment: 'id, serial_number, equipment_type, site_id, operational_status',
      consumables: 'id, lot_number, consumable_type, site_id, expiry_date',
      accessRequests: 'id, request_number, requester_id, status, created_at',
      pendingActions: '++id, type, action, timestamp',
      syncMetadata: 'key',
    });
  }
}

export const db = new ClinicalStorageDB();
