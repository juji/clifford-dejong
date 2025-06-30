"use client";
import { useEffect } from "react";
import { useAttractorRecords } from "../hooks/use-attractor-records";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function ConfigSelectionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { records, loading, error, total, loadMore, refresh } = useAttractorRecords();

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
        <div className="mt-4 h-64 overflow-y-auto border rounded bg-muted/30 p-2">
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
                <li key={rec.uuid} className="flex justify-between items-center p-2 bg-background rounded shadow-sm">
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
            onClick={loadMore}
            disabled={loading}
          >
            Load More
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
