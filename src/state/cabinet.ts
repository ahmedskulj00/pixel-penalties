import type { Trophy } from '@/types';
import { createStore, useStore } from './createStore';

function parseCabinet(raw: unknown): Trophy[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is Trophy => t && typeof t.compId === 'string' && typeof t.editionId === 'string' && typeof t.nationId === 'string');
}

export const cabinetStore = createStore<Trophy[]>('pp.cabinet.v1', [], parseCabinet);

export const useCabinet = (): Trophy[] => useStore(cabinetStore);

export function addTrophy(entry: Omit<Trophy, 'at'>): void {
  cabinetStore.set((list) => {
    const exists = list.some((t) => t.compId === entry.compId && t.editionId === entry.editionId && t.nationId === entry.nationId);
    return exists ? list : [...list, { ...entry, at: Date.now() }];
  });
}
