"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ReasonModalProps = {
  title: string;
  description?: string;
  confirmLabel: string;
  showDuration?: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string, durationMinutes: number | null) => Promise<void> | void;
};

export function ReasonModal({
  title,
  description,
  confirmLabel,
  showDuration = false,
  busy = false,
  error = null,
  onClose,
  onConfirm
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("1440");
  const [indefinite, setIndefinite] = useState(false);

  async function submit() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) return;
    const minutes = showDuration ? (indefinite ? null : Number(duration) || null) : null;
    await onConfirm(trimmed, minutes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-8 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg border border-line bg-paper p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Confirm</div>
        <h2 className="mt-2 font-accent text-3xl">{title}</h2>
        {description ? <p className="mt-3 font-sans text-sm leading-6 text-muted">{description}</p> : null}
        <label className="mt-5 block font-sans text-sm font-bold">
          Reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Write a short note for the log."
            className="mt-2 min-h-28 w-full border border-line bg-paper px-3 py-3 font-body font-normal"
          />
        </label>
        {showDuration ? (
          <div className="mt-4 space-y-3 font-sans text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={indefinite} onChange={(event) => setIndefinite(event.target.checked)} />
              Indefinite mute
            </label>
            {indefinite ? null : (
              <label className="block font-bold">
                Duration (minutes)
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="mt-2 w-full border border-line bg-paper px-3 py-3 font-body font-normal"
                />
              </label>
            )}
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="quiet" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={busy || reason.trim().length < 3}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
