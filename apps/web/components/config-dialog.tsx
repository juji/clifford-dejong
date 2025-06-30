"use client";
import { useAttractorRecords } from "../hooks/use-attractor-records";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function ConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { records, loading, error } = useAttractorRecords();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saved Config</DialogTitle>
        </DialogHeader>
        <div className="mt-4 h-64 overflow-y-auto border rounded bg-muted/30 p-2">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-center text-destructive">{String(error)}</div>
          ) : records.length === 0 ? (
            <div className="text-center text-muted-foreground">No saved configs found.</div>
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
      </DialogContent>
    </Dialog>
  );
}
