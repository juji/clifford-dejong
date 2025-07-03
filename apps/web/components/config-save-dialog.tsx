"use client";
import { useState, useEffect } from "react";
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await addRecord({ name, attractorParameters });
      // Add a small delay to ensure the saving state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      setName("");
      setSuccess(true);
      if (onSave) onSave();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

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
              data-testid="config-name-input"
            />
          </div>
          <Button
            onClick={success ? handleClose : handleSave}
            disabled={saving || (!name.trim() && !success)}
            data-testid={success ? "close-button" : saving ? "saving-button" : "save-button"}
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
