"use client";

import { useRef, useState } from "react";
import { Flag, Heart, Link2, Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/feedback/ToastProvider";
import { useFavorites } from "@/lib/client/favorites";
import styles from "./ScenePackActions.module.css";

const REPORT_REASONS = [
  { value: "broken_download", label: "Broken download" },
  { value: "incorrect_information", label: "Incorrect information" },
  { value: "incorrect_thumbnail", label: "Incorrect thumbnail" },
  { value: "duplicate", label: "Duplicate" },
  { value: "other", label: "Other" },
] as const;

export function ScenePackActions({ id, title }: { id: string; title: string }) {
  const toast = useToast();
  const favorites = useFavorites();
  const saved = favorites.has(id);
  const reportRef = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);

  function currentUrl() {
    return window.location.href.split("#")[0];
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      toast.show("Link copied.");
    } catch {
      toast.show("Couldn't copy the link — copy it from the address bar.", "error");
    }
  }

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${title} · FoundingVFX`, url: currentUrl() });
      } catch (error) {
        if ((error as Error).name !== "AbortError") await copyLink();
      }
    } else {
      await copyLink();
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenePackId: id, reason: data.get("reason"), details: data.get("details") || undefined }),
      });
      if (res.status === 429) throw new Error("Too many reports — please try again later.");
      if (!res.ok) throw new Error("Couldn't send your report. Please try again.");
      reportRef.current?.close();
      toast.show("Thanks — your report was sent to the FoundingVFX team.");
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          icon={<Heart size={17} aria-hidden fill={saved ? "currentColor" : "none"} className={saved ? styles.saved : undefined} />}
          aria-pressed={saved}
          onClick={() => {
            const added = favorites.toggle(id);
            toast.show(added ? "ScenePack added to favorites." : "Removed from favorites.", added ? "success" : "info");
          }}
        >
          {saved ? "Favorited" : "Favorite"}
        </Button>
        <Button variant="secondary" icon={<Share2 size={17} aria-hidden />} onClick={share}>
          Share
        </Button>
        <Button variant="secondary" icon={<Link2 size={17} aria-hidden />} onClick={copyLink}>
          Copy link
        </Button>
        <Button variant="ghost" icon={<Flag size={16} aria-hidden />} onClick={() => reportRef.current?.showModal()}>
          Report
        </Button>
      </div>
      <p className={styles.note}>Favorites are saved on this device.</p>

      <dialog ref={reportRef} className={styles.dialog} aria-labelledby="report-title">
        <form onSubmit={submitReport} className={styles.form}>
          <div className={styles.dialogHeader}>
            <h2 id="report-title">Report a problem</h2>
            <button type="button" className={styles.close} onClick={() => reportRef.current?.close()} aria-label="Close">
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className={styles.dialogLead}>What&rsquo;s wrong with “{title}”?</p>
          <fieldset className={styles.reasons}>
            <legend className="visually-hidden">Reason</legend>
            {REPORT_REASONS.map((r, i) => (
              <label key={r.value} className={styles.reason}>
                <input type="radio" name="reason" value={r.value} defaultChecked={i === 0} required />
                <span>{r.label}</span>
              </label>
            ))}
          </fieldset>
          <label className={styles.field}>
            <span>Details (optional)</span>
            <textarea name="details" rows={3} maxLength={500} placeholder="Anything that helps us fix it" />
          </label>
          <div className={styles.dialogActions}>
            <Button variant="ghost" onClick={() => reportRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} icon={submitting ? <Loader2 size={16} className={styles.spin} aria-hidden /> : undefined}>
              Send report
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
