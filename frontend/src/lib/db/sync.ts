import { db, type OfflinePendingAction } from './schema';
import { documentsApi } from '@/lib/api/documents';
import { equipmentApi } from '@/lib/api/equipment';
import { consumablesApi } from '@/lib/api/consumables';

const MAX_RETRIES = 3;

export class SyncManager {
  async queueAction(type: string, action: string, data: unknown): Promise<void> {
    await db.pendingActions.add({
      type,
      action,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString(),
      retries: 0,
    });
  }

  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    const actions = await db.pendingActions.toArray();
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        await this.executeAction(action);
        await db.pendingActions.delete(action.id!);
        success++;
      } catch {
        const retries = action.retries + 1;
        if (retries >= MAX_RETRIES) {
          await db.pendingActions.delete(action.id!);
          failed++;
        } else {
          await db.pendingActions.update(action.id!, { retries });
        }
      }
    }

    return { success, failed };
  }

  private async executeAction(action: OfflinePendingAction): Promise<void> {
    const data = JSON.parse(action.data);

    switch (action.type) {
      case 'documents':
        await this.executeDocumentAction(action.action, data);
        break;
      case 'equipment':
        await this.executeEquipmentAction(action.action, data);
        break;
      case 'consumables':
        await this.executeConsumableAction(action.action, data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeDocumentAction(action: string, data: unknown): Promise<void> {
    switch (action) {
      case 'create':
        await documentsApi.create(data as Parameters<typeof documentsApi.create>[0]);
        break;
      case 'update': {
        const { id, ...rest } = data as { id: string };
        await documentsApi.update(id, rest as Parameters<typeof documentsApi.update>[1]);
        break;
      }
      case 'delete':
        await documentsApi.delete((data as { id: string }).id);
        break;
    }
  }

  private async executeEquipmentAction(action: string, data: unknown): Promise<void> {
    switch (action) {
      case 'create':
        await equipmentApi.create(data as Parameters<typeof equipmentApi.create>[0]);
        break;
      case 'update': {
        const { id, ...rest } = data as { id: string };
        await equipmentApi.update(id, rest as Parameters<typeof equipmentApi.update>[1]);
        break;
      }
    }
  }

  private async executeConsumableAction(action: string, data: unknown): Promise<void> {
    switch (action) {
      case 'create':
        await consumablesApi.create(data as Parameters<typeof consumablesApi.create>[0]);
        break;
      case 'update': {
        const { id, ...rest } = data as { id: string };
        await consumablesApi.update(id, rest as Parameters<typeof consumablesApi.update>[1]);
        break;
      }
    }
  }

  async downloadForOffline(): Promise<void> {
    const [docs, equip, cons] = await Promise.all([
      documentsApi.getAll({ page: 1, page_size: 1000 }),
      equipmentApi.getAll({ page: 1, page_size: 1000 }),
      consumablesApi.getAll({ page: 1, page_size: 1000 }),
    ]);

    await db.transaction('rw', [db.documents, db.equipment, db.consumables, db.syncMetadata], async () => {
      await db.documents.clear();
      await db.equipment.clear();
      await db.consumables.clear();

      if (docs?.items) {
        await db.documents.bulkPut(docs.items.map((d) => ({
          id: d.id,
          subject_id: d.subject_id,
          document_type: d.document_type,
          study_id: d.study?.protocol_number ?? '',
          site_id: d.site?.site_number ?? '',
          status: d.status,
          description: d.description ?? '',
          created_at: d.created_at,
          updated_at: d.updated_at ?? '',
        })));
      }

      if (equip?.items) {
        await db.equipment.bulkPut(equip.items.map((e) => ({
          id: e.id,
          serial_number: e.serial_number,
          equipment_type: e.equipment_type,
          site_id: e.site?.site_number ?? '',
          operational_status: e.operational_status,
          created_at: e.created_at,
          updated_at: e.updated_at ?? '',
        })));
      }

      if (cons?.items) {
        await db.consumables.bulkPut(cons.items.map((c) => ({
          id: c.id,
          lot_number: c.lot_number,
          consumable_type: c.consumable_type,
          site_id: c.site?.site_number ?? '',
          expiry_date: c.expiry_date,
          quantity: c.quantity,
          created_at: c.created_at,
          updated_at: c.updated_at ?? '',
        })));
      }

      await db.syncMetadata.put({
        key: 'lastSync',
        value: new Date().toISOString(),
      });
    });
  }

  async getLastSyncDate(): Promise<string | null> {
    const meta = await db.syncMetadata.get('lastSync');
    return meta?.value ?? null;
  }

  async getPendingCount(): Promise<number> {
    return db.pendingActions.count();
  }
}

export const syncManager = new SyncManager();
