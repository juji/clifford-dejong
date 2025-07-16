import { create } from "zustand";
import type { AttractorParameters } from "@repo/core/types";
import {
  saveAttractor,
  getPaginatedAttractors,
  deleteAttractor,
  AttractorRecord,
} from "@/lib/attractor-indexdb";

interface AttractorRecordsState {
  records: AttractorRecord[];
  total: number;
  page: number | null;
  loading: boolean;
  error: unknown;
  fetchRecords: (pageToFetch: number) => Promise<void>;
  addRecord: (record: {
    name: string;
    attractorParameters: AttractorParameters;
    image: string;
  }) => Promise<void>;
  removeRecord: (uuid: string) => Promise<void>;
  loadMore: () => void;
  refresh: () => void;
}

export const useAttractorRecordsStore = create<AttractorRecordsState>(
  (set, get) => ({
    records: [],
    total: 0,
    page: null,
    loading: false,
    error: null,
    fetchRecords: async (pageToFetch) => {
      set({ loading: true, error: null });
      try {
        const { records: newRecords, total } =
          await getPaginatedAttractors(pageToFetch);
        set((state) => ({
          records:
            pageToFetch === 0 ? newRecords : [...state.records, ...newRecords],
          total,
          page: pageToFetch,
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
        await get().fetchRecords(0);
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
        await get().fetchRecords(0);
      } catch (err) {
        set({ error: err });
      } finally {
        set({ loading: false });
      }
    },
    loadMore: () => {
      const { page, records, total, loading } = get();
      if (records.length < total && !loading) {
        const nextPage = (page ?? -1) + 1;
        get().fetchRecords(nextPage);
      }
    },
    refresh: () => {
      get().fetchRecords(0);
    },
  }),
);
