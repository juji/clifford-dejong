"use client";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useAttractorRecordsStore } from "../store/attractor-records-store";
import { Button } from "./ui/button";
import { useAttractorStore } from "@repo/state/attractor-store";

export function ConfigSaveDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave?: () => void }) {
  const [name, setName] = useState("");
  const addRecord = useAttractorRecordsStore((s) => s.addRecord);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);

  const handleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await addRecord({ name, attractorParameters });
      setSuccess(true);
      setName("");
      if (onSave) onSave();
      if(handleSaveTimeoutRef.current) {
        clearTimeout(handleSaveTimeoutRef.current);
      }
      handleSaveTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Config</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">save current attractor configuration</p>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <input
            className="border rounded p-2"
            type="text"
            placeholder="Config name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {error ? <div className="text-destructive text-center">{String(error)}</div> : null}
          {success ? <div className="text-green-600 text-center">Saved!</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
