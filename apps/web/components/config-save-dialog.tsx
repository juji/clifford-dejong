"use client";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useAttractorRecordsStore } from "@/store/attractor-records-store";
import { Button } from "./ui/button";
import { useAttractorStore } from "@repo/state/attractor-store";
import { waitForImage } from "@/lib/wait-for-image";

export function ConfigSaveDialog({
  open,
  onOpenChange,
  waitForImageFn = waitForImage,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waitForImageFn?: () => Promise<string>; // Allow injecting a custom wait function for testing
  onSave?: () => void;
}) {
  // Reset state when dialog visibility changes
  useEffect(() => {
    if (!open) {
      // When dialog is closed, reset all state
      setName("");
      setSuccess(false);
      setError(null);
      setSaving(false);
    }
  }, [open]);
  const [name, setName] = useState("");
  const addRecord = useAttractorRecordsStore((s) => s.addRecord);
  const [saving, setSaving] = useState(false);
  const [waitingImage, setWaitingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      setWaitingImage(true);
      const resizedImage = await waitForImageFn();
      setWaitingImage(false);
      await addRecord({ name, attractorParameters, image: resizedImage });
      setName("");
      setSuccess(true);
      if (onSave) onSave();
    } catch (err) {
      console.error("Error saving attractor config:", err);
      setError(err);
    } finally {
      setWaitingImage(false);
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSuccess(false);
    setError(null);
    setSaving(false);
    onOpenChange(false);
  };

  // auto close on save success
  const timerTo = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (success) {
      if (timerTo.current) clearTimeout(timerTo.current);
      timerTo.current = setTimeout(() => {
        handleClose();
      }, 2000); // Close after 2 seconds
      return () => {
        if (timerTo.current) clearTimeout(timerTo.current); // Cleanup on unmount or success change
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Config</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            save current attractor configuration
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="config-name" className="sr-only">
              Config name
            </label>
            <input
              id="config-name"
              key={open ? "dialog-open" : "dialog-closed"}
              className="border rounded p-2 w-full"
              type="text"
              placeholder="Config name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              role="textbox"
              aria-label="Config name"
            />
          </div>
          <Button
            onClick={success ? handleClose : handleSave}
            disabled={saving || (!name.trim() && !success)}
            aria-label={
              success
                ? "Close"
                : waitingImage
                  ? "Waiting Image..."
                  : saving
                    ? "Saving..."
                    : "Save"
            }
            aria-busy={saving}
          >
            {success
              ? "Close"
              : waitingImage
                ? "Waiting Image..."
                : saving
                  ? "Saving..."
                  : "Save"}
          </Button>
          {/* Use aria-live for dynamic announcements */}
          <div aria-live="polite" className={error || success ? "" : "sr-only"}>
            {error ? (
              <div className="text-destructive text-center">
                {error.toString()}
              </div>
            ) : success ? (
              <div className="text-green-600 text-center">Saved!</div>
            ) : (
              "Configuration ready to save."
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
