import { create } from 'zustand';
import type { AttractorParameters } from '@repo/core/types';
import {
  saveAttractor,
  getPaginatedAttractors,
  deleteAttractor,
  AttractorRecord,
} from '../lib/attractor-indexdb';

interface AttractorRecordsState {
  records: AttractorRecord[];
  total: number;
  page: number | null;
  loading: boolean;
  error: unknown;
  fetchRecords: () => Promise<void>;
  addRecord: (record: { name: string; attractorParameters: AttractorParameters }) => Promise<void>;
  removeRecord: (uuid: string) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
}

export const useAttractorRecordsStore = create<AttractorRecordsState>((set, get) => ({
  records: [],
  total: 0,
  page: null,
  loading: false,
  error: null,
  fetchRecords: async () => {
    const { page } = get();
    if (page === null) return;
    set({ loading: true, error: null });
    try {
      const { records: newRecords, total } = await getPaginatedAttractors(page);
      set((state) => ({
        records: [...state.records, ...newRecords],
        total,
      }));
    } catch (err) {
      set({ error: err });
    } finally {
      set({ loading: false });
    }
  },
  addRecord: async (record) => {
    set({ loading: true, error: null });
    try {
      await saveAttractor(record);
      set({ records: [], page: 0 });
      await get().fetchRecords();
    } catch (err) {
      set({ error: err });
    } finally {
      set({ loading: false });
    }
  },
  removeRecord: async (uuid) => {
    set({ loading: true, error: null });
    try {
      await deleteAttractor(uuid);
      set({ records: [], page: 0 });
      await get().fetchRecords();
    } catch (err) {
      set({ error: err });
    } finally {
      set({ loading: false });
    }
  },
  loadMore: () => {
    const { page, records, total, loading } = get();
    if (page === null) return;
    if (records.length < total && !loading) {
      set({ page: page === null ? 0 : page + 1 });
      get().fetchRecords();
    }
  },
  refresh: () => {
    set({ records: [], page: 0 });
    get().fetchRecords();
  },
}));
