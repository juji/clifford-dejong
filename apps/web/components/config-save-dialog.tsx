"use client";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useAttractorRecordsStore } from "../store/attractor-records-store";
import { Button } from "./ui/button";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useUIStore } from "@/store/ui-store";
import { resizeBase64Image } from "@/lib/resize-base64-image";

export function ConfigSaveDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave?: () => void }) {
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);

  const waitForImage = async (maxWaitMs = 500000): Promise<string> => {

    let currentImageUrl = useUIStore.getState().imageUrl;
    if (currentImageUrl) {
      // If imageUrl is already available, return it immediately
      return currentImageUrl;
    }

    // Otherwise, wait for imageUrl to become available in the store
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for image URL to become available"));
      }, maxWaitMs);

      // Set up an interval to check for imageUrl
      const checkInterval = setInterval(() => {
        currentImageUrl = useUIStore.getState().imageUrl;
        if (currentImageUrl) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(currentImageUrl);
        }
      }, 500); // Check every 500ms
    });
  };
  

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Saving attractor config:", name, attractorParameters);
      const img = await waitForImage()
      console.log('image', img)
      const resizedImage = await resizeBase64Image(img);
      console.log("resizedImage", resizedImage);
      
      await addRecord({ name, attractorParameters, image: resizedImage });
      setName("");
      setSuccess(true);
      if (onSave) onSave();
    } catch (err) {
      console.error("Error saving attractor config:", err);
      setError(err);
    } finally {
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
      if(timerTo.current) clearTimeout(timerTo.current);
      timerTo.current = setTimeout(() => {
        handleClose();
      }, 2000); // Close after 2 seconds
      return () => {
        if(timerTo.current) clearTimeout(timerTo.current); // Cleanup on unmount or success change
      }
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
            <label htmlFor="config-name" className="sr-only">Config name</label>
            <input
              id="config-name"
              key={open ? "dialog-open" : "dialog-closed"}
              className="border rounded p-2 w-full"
              type="text"
              placeholder="Config name"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              role="textbox"
              aria-label="Config name"
            />
          </div>
          <Button
            onClick={success ? handleClose : handleSave}
            disabled={saving || (!name.trim() && !success)}
            aria-label={success ? "Close" : saving ? "Saving..." : "Save"}
            aria-busy={saving}
          >
            {success ? "Close" : saving ? "Saving..." : "Save"}
          </Button>
          {error ? (
            <div className="text-destructive text-center" role="alert">
              {error.toString()}
            </div>
          ) : null}
          {success ? (
            <div className="text-green-600 text-center" role="status">
              Saved!
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
