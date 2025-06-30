"use client";
import { useEffect, useRef } from "react";
import { useAttractorRecords } from "../hooks/use-attractor-records";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function ConfigSelectionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { records, loading, error, total, loadMore, refresh } = useAttractorRecords();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRecordsLength = useRef(records.length);
  // Use a ref to store scroll position between renders
  const scrollFromBottomRef = useRef<number | null>(null);
  // Ref to store the last record's uuid before loading more
  const lastRecordUuidRef = useRef<string | null>(null);

  // Handler for Load More button to preserve scroll position
  const handleLoadMore = () => {
    if (records.length > 0) {
      lastRecordUuidRef.current = records[records.length - 1]?.uuid ?? null;
    } else {
      lastRecordUuidRef.current = null;
    }
    loadMore();
  };

  useEffect(() => {
    // Restore scroll position after records are added
    const el = scrollRef.current;
    if (el && typeof scrollFromBottomRef.current === 'number') {
      el.scrollTop = el.scrollHeight - scrollFromBottomRef.current;
      scrollFromBottomRef.current = null;
    }
    prevRecordsLength.current = records.length;
  }, [records.length]);

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (lastRecordUuidRef.current) {
      const el = document.querySelector(
        `[data-record-uuid="${lastRecordUuidRef.current}"]`
      );
      if (el && el instanceof HTMLElement) {
        el.scrollIntoView({ block: "start" }); // removed smooth animation for instant scroll
      }
      lastRecordUuidRef.current = null;
    }
    prevRecordsLength.current = records.length;
  }, [records.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saved Config</DialogTitle>
        </DialogHeader>
        <div ref={scrollRef} className="mt-4 h-64 overflow-y-auto border rounded bg-muted/30 p-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-center text-destructive">{String(error)}</div>
          ) : records.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p>No saved configs found.</p>
                <p>Create one by clicking on the save button.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {records.map((rec) => (
                <li
                  key={rec.uuid}
                  data-record-uuid={rec.uuid}
                  className="flex justify-between items-center p-2 bg-background rounded shadow-sm"
                >
                  <span className="font-medium">{rec.name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(rec.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {records.length < total && !loading && (
          <button
            className="mt-2 w-full py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
            onClick={handleLoadMore}
            disabled={loading}
          >
            Load More
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
