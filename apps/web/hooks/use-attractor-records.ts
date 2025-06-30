import { useCallback, useEffect, useState } from "react";
import type { AttractorParameters } from "@repo/core/types";
import {
  saveAttractor,
  getPaginatedAttractors,
  deleteAttractor,
  AttractorRecord,
} from "../lib/attractor-indexdb";

// The page state is managed internally, records is an accumulation
export function useAttractorRecords() {
  const [records, setRecords] = useState<AttractorRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchRecords = useCallback(async () => {
    if (page === null) return;
    setLoading(true);
    setError(null);
    try {
      const { records: newRecords, total } = await getPaginatedAttractors(page);
      setRecords((prev) => [...prev, ...newRecords]);
      setTotal(total);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const addRecord = useCallback(
    async (record: { name: string; attractorParameters: AttractorParameters }) => {
      setLoading(true);
      setError(null);
      try {
        await saveAttractor(record);
        setRecords([]); // reset accumulation
        setPage(0); // reset to first page
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeRecord = useCallback(
    async (uuid: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteAttractor(uuid);
        setRecords([]); // reset accumulation
        setPage(0); // reset to first page
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(() => {
    if (page === null) return;
    if (records.length < total && !loading) {
      setPage((p) => (p === null ? 0 : p + 1));
    }
  }, [records.length, total, loading, page]);

  const refresh = useCallback(() => {
    setRecords([]);
    setPage(0);
  }, []);

  return {
    records,
    total,
    loading,
    error,
    addRecord,
    removeRecord,
    loadMore,
    refresh,
  };
}
