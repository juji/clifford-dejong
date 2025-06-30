"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useAttractorRecords } from "../hooks/use-attractor-records";
import { Button } from "./ui/button";
import { useAttractorStore } from "@repo/state/attractor-store";

export function ConfigSaveDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave?: () => void }) {
  const [name, setName] = useState("");
  const { addRecord } = useAttractorRecords();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await addRecord({ name, attractorParameters });
      setSuccess(true);
      setName("");
      if (onSave) onSave();
      onOpenChange(false);
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
