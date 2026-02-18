export type ConflictStrategy = 'SERVER_WINS' | 'CLIENT_WINS' | 'LAST_WRITE_WINS' | 'MERGE' | 'ASK_USER';

interface Timestamped {
  updated_at: string;
  [key: string]: unknown;
}

interface ConflictResult<T> {
  resolved: boolean;
  data: T;
  needsUserDecision?: boolean;
  localData?: T;
  serverData?: T;
}

export function resolveConflict<T extends Timestamped>(
  localData: T,
  serverData: T,
  strategy: ConflictStrategy = 'SERVER_WINS'
): ConflictResult<T> {
  switch (strategy) {
    case 'SERVER_WINS':
      return { resolved: true, data: serverData };

    case 'CLIENT_WINS':
      return { resolved: true, data: localData };

    case 'LAST_WRITE_WINS': {
      const localTime = new Date(localData.updated_at).getTime();
      const serverTime = new Date(serverData.updated_at).getTime();
      return {
        resolved: true,
        data: localTime > serverTime ? localData : serverData,
      };
    }

    case 'MERGE':
      return {
        resolved: true,
        data: {
          ...serverData,
          ...localData,
          updated_at: new Date().toISOString(),
        },
      };

    case 'ASK_USER':
      return {
        resolved: false,
        data: serverData,
        needsUserDecision: true,
        localData,
        serverData,
      };

    default:
      return { resolved: true, data: serverData };
  }
}
