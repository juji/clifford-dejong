"use client";
import { useEffect, useRef, useState } from "react";
import { useAttractorRecordsStore } from "@/store/attractor-records-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { AttractorRecord } from "@/lib/attractor-indexdb";
import { useAttractorStore } from "@repo/state/attractor-store";
import touchStyles from "./touch-styles.module.css";

export function ConfigSelectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
          <DialogTitle>Attractor Gallery</DialogTitle>
          <DialogDescription>
            Browse and select from your saved attractor configurations.
          </DialogDescription>
        </DialogHeader>
        {/* Aria-live region for announcements */}
        <div aria-live="polite" className="sr-only">
          {error
            ? `Error loading configurations: ${String(error)}`
            : records.length === 0
              ? "No saved configurations found."
              : `${records.length} configurations loaded.`}
        </div>

        <div className="mt-4 max-h-[30vh] border rounded bg-muted/30 p-2 flex flex-col">
          {error ? (
            <div className="flex h-full items-center justify-center text-center text-destructive">
              {String(error)}
            </div>
          ) : records.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p>No saved configs found.</p>
                <p>Create one by clicking on the save button.</p>
              </div>
            </div>
          ) : (
            <AttractorRecordList onSelect={() => onOpenChange(false)} />
          )}
        </div>
        <button
          className="mt-2 w-full py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 z-10"
          onClick={loadMore}
          disabled={records.length >= total}
        >
          Load More
        </button>
      </DialogContent>
    </Dialog>
  );
}

function AttractorRecordList({ onSelect }: { onSelect: () => void }) {
  const records = useAttractorRecordsStore(
    (s) => s.records,
  ) as AttractorRecord[];
  const loading = useAttractorRecordsStore((s) => s.loading);
  const loadMore = useAttractorRecordsStore((s) => s.loadMore);
  const removeRecord = useAttractorRecordsStore((s) => s.removeRecord);
  const hasMore = useAttractorRecordsStore((s) => s.records.length < s.total);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const detectionElmRef = useRef<HTMLLIElement | null>(null);
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // If there's no element to observe or we don't need more data, don't set up the observer
    if (!detectionElmRef.current || !hasMore) return;

    // Create a local variable to avoid issues with closures
    const currentElement = detectionElmRef.current;

    try {
      // Create new observer
      const observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0] && entries[0].isIntersecting && !loading) {
            loadMore();
          }
        },
        { root: currentElement.parentElement, threshold: 0.1 },
      );

      // Start observing
      observer.observe(currentElement);
      observerRef.current = observer;

      // Return cleanup function
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    } catch (error) {
      console.error("Error setting up IntersectionObserver:", error);
      // Fallback to regular loading if IntersectionObserver fails
      return undefined;
    }
  }, [records.length, loadMore, loading, hasMore]);

  // State for announcing deletion actions to screen readers
  const [deleteAnnouncement, setDeleteAnnouncement] = useState("");

  // Handler for delete button click
  const handleDeleteClick = (uuid: string) => {
    const currentRecord = records.find((rec) => rec.uuid === uuid);
    const recordName = currentRecord?.name || "configuration";

    if (confirmDeleteId === uuid) {
      // If already in confirm state, actually delete
      removeRecord(uuid);
      setConfirmDeleteId(null);
      setDeleteAnnouncement(`Deleted ${recordName}`);

      // Clear any existing timeout
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }

      // Clear announcement after 2 seconds
      setTimeout(() => setDeleteAnnouncement(""), 2000);
    } else {
      // Set confirm state for this record
      setConfirmDeleteId(uuid);
      setDeleteAnnouncement(`Confirm deletion of ${recordName}?`);

      // Clear any existing timeout
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }

      // Set timeout to clear confirm state after 5 seconds
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        setDeleteAnnouncement("");
      }, 5000);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Aria-live region for deletion actions */}
      <div
        aria-live="assertive"
        className={deleteAnnouncement ? "" : "sr-only"}
      >
        {deleteAnnouncement}
      </div>

      <ul className="space-y-2 h-full overflow-y-auto">
        {records.map((rec, idx) => {
          const isLastElement = idx === records.length - 1;
          return (
            <li
              key={rec.uuid}
              data-record-uuid={rec.uuid}
              className={`flex justify-between items-center p-2 bg-background rounded shadow-sm group hover:bg-muted/20 transition-colors ${touchStyles.container}`}
              ref={isLastElement && hasMore ? detectionElmRef : undefined}
            >
              <div
                className="flex items-center gap-3 flex-grow cursor-pointer"
                onClick={() => {
                  setAttractorParams(rec.attractorParameters);
                  onSelect();
                }}
              >
                {rec.image && (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    {/* Using data URL directly with img since Next/Image doesn't support base64 data URLs efficiently */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rec.image}
                      alt={rec.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="font-medium">{rec.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {new Date(rec.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteClick(rec.uuid)}
                className={`text-xs py-2 transition-opacity min-w-[110px] text-center ${touchStyles.touchVisible} ${touchStyles.touchHidden} ${
                  confirmDeleteId === rec.uuid
                    ? "text-red-500 font-medium animate-pulse"
                    : "text-destructive"
                }`}
                aria-label={
                  confirmDeleteId === rec.uuid
                    ? `Confirm deletion of configuration '${rec.name}'`
                    : `Delete configuration '${rec.name}'`
                }
              >
                {confirmDeleteId === rec.uuid ? "Confirm Deletion?" : "Delete"}
              </button>
            </li>
          );
        })}
        {loading ? (
          <li className="flex items-center justify-center p-2 text-muted-foreground">
            <span>Loading...</span>
          </li>
        ) : null}
      </ul>
    </>
  );
}
