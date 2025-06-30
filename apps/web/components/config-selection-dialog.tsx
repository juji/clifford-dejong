"use client";
import { useEffect, useRef } from "react";
import { useAttractorRecordsStore } from "../store/attractor-records-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { AttractorRecord } from "../lib/attractor-indexdb";

export function ConfigSelectionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const records = useAttractorRecordsStore((s) => s.records);
  const error = useAttractorRecordsStore((s) => s.error);
  const total = useAttractorRecordsStore((s) => s.total);
  const loadMore = useAttractorRecordsStore((s) => s.loadMore);
  const refresh = useAttractorRecordsStore((s) => s.refresh);

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saved Config</DialogTitle>
        </DialogHeader>
        <div className="mt-4 h-64 border rounded bg-muted/30 p-2 flex flex-col">
          {error ? (
            <div className="flex h-full items-center justify-center text-center text-destructive">{String(error)}</div>
          ) : records.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p>No saved configs found.</p>
                <p>Create one by clicking on the save button.</p>
              </div>
            </div>
          ) : (
            <AttractorRecordList />
          )}
        </div>
        <button
          className="mt-2 w-full py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 sticky bottom-0 z-10"
          onClick={loadMore}
          disabled={records.length >= total}
        >
          Load More
        </button>
      </DialogContent>
    </Dialog>
  );
}

function AttractorRecordList() {
  const records = useAttractorRecordsStore((s) => s.records) as AttractorRecord[];
  const loading = useAttractorRecordsStore((s) => s.loading);
  const loadMore = useAttractorRecordsStore((s) => s.loadMore);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const detectionElmRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (!detectionElmRef.current) return;
    observerRef.current = new window.IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { root: detectionElmRef.current.parentElement, threshold: 0.1 }
    );
    observerRef.current.observe(detectionElmRef.current);
    return () => observerRef.current?.disconnect();
  }, [records.length, loadMore, loading]);

  return (
    <ul className="space-y-2 h-full overflow-y-auto">
      {records.map((rec, idx) => {
        const isDetectionElm = idx === records.length - 10;
        return (
          <li
            key={rec.uuid}
            data-record-uuid={rec.uuid}
            className="flex justify-between items-center p-2 bg-background rounded shadow-sm"
            ref={isDetectionElm ? detectionElmRef : undefined}
          >
            <span className="font-medium">{rec.name}</span>
            <span className="text-xs text-muted-foreground">{new Date(rec.createdAt).toLocaleString()}</span>
          </li>
        );
      })}
      { loading ? (
        <li className="flex items-center justify-center p-2 text-muted-foreground">
          <span>Loading...</span>
        </li>
      ) : null}
    </ul>
  );
}
