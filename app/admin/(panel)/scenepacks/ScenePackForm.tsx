"use client";

import { useState } from "react";
import {
  AdminForm,
  CheckboxGroup,
  DateTimeInput,
  ImageInput,
  Section,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
  TriState,
  type Option,
} from "@/components/admin/FormKit";
import type { FormState } from "@/lib/admin/form-state";
import styles from "@/components/admin/admin.module.css";

export type ScenePackFormValues = {
  title: string;
  slug: string;
  description: string;
  showId: string;
  characterIds: string[];
  genreIds: string[];
  tagSlugs: string[];
  season: number | null;
  episode: number | null;
  episodeTitle: string | null;
  releaseYear: number | null;
  thumbnailUrl: string | null;
  thumbnailAlt: string | null;
  resolution: string;
  fps: number;
  format: string;
  fileSize: number | null;
  fileSizeUnit: "MB" | "GB";
  clipCount: number;
  aspectRatio: string | null;
  hasAudio: boolean | null;
  isRaw: boolean | null;
  isClean: boolean | null;
  isColorGraded: boolean | null;
  isUpscaled: boolean | null;
  hasWatermark: boolean | null;
  status: string;
  publishedAt: string | null;
  featured: boolean;
  version: string;
  storageProvider: string;
  downloadUrl: string;
  objectId: string;
  checksum: string;
};

const PROVIDERS = [
  { value: "", label: "No file yet" },
  { value: "google_drive", label: "Google Drive" },
  { value: "mega", label: "MEGA" },
  { value: "terabox", label: "TeraBox" },
  { value: "external_url", label: "Other HTTPS link" },
  { value: "cloudflare_r2", label: "Cloudflare R2 (file path)" },
  { value: "backblaze_b2", label: "Backblaze B2 (file path)" },
];

const BUCKET_PROVIDERS = new Set(["cloudflare_r2", "backblaze_b2"]);

export function ScenePackForm({
  action,
  values,
  shows,
  characters,
  genres,
  tags,
  canFeature,
  isNew,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  values: ScenePackFormValues;
  shows: Option[];
  characters: Option[];
  genres: Option[];
  tags: Option[];
  canFeature: boolean;
  isNew: boolean;
}) {
  const [showId, setShowId] = useState(values.showId);
  const [status, setStatus] = useState(values.status);
  const [provider, setProvider] = useState(values.storageProvider);
  const isBucket = BUCKET_PROVIDERS.has(provider);

  return (
    <AdminForm action={action} submitLabel={isNew ? "Create ScenePack" : "Save changes"}>
      <Section title="Basics">
        <TextInput label="Title" name="title" defaultValue={values.title} required maxLength={160} wide />
        <SelectInput label="Show" name="showId" value={showId} onChange={(e) => setShowId(e.target.value)} placeholder="Choose a show…" options={shows} />
        <TextInput label="Slug" name="slug" defaultValue={values.slug} hint="Leave blank to generate from the title" />
        <TextArea label="Description" name="description" defaultValue={values.description} maxLength={4000} rows={4} />
      </Section>

      <Section title="Characters, genres & tags">
        <CheckboxGroup label="Characters" name="characterIds" options={characters} defaultValue={values.characterIds} filterGroup={showId || null} hint="Showing characters from the selected show" />
        <CheckboxGroup label="Genres" name="genreIds" options={genres} defaultValue={values.genreIds} />
        <CheckboxGroup label="Tags" name="tagSlugs" options={tags} defaultValue={values.tagSlugs} />
        <TextInput label="New tags" name="newTags" hint="Comma-separated, e.g. villain, dark" wide />
      </Section>

      <Section title="Episode">
        <TextInput label="Season" name="season" type="number" min={0} max={99} defaultValue={values.season ?? ""} />
        <TextInput label="Episode" name="episode" type="number" min={0} max={999} defaultValue={values.episode ?? ""} />
        <TextInput label="Episode title" name="episodeTitle" defaultValue={values.episodeTitle ?? ""} maxLength={160} />
        <TextInput label="Release year" name="releaseYear" type="number" min={1900} max={2100} defaultValue={values.releaseYear ?? ""} />
      </Section>

      <Section title="Thumbnail">
        <ImageInput label="Thumbnail" name="thumbnail" current={values.thumbnailUrl} hint="16:9, e.g. 1920×1080 · up to 5 MB" />
        <TextInput label="Alt text" name="thumbnailAlt" defaultValue={values.thumbnailAlt ?? ""} hint="Describe the image for screen readers" maxLength={200} />
      </Section>

      <Section title="Technical">
        <SelectInput label="Resolution" name="resolution" defaultValue={values.resolution} options={["720p", "1080p", "1440p", "4K"].map((r) => ({ value: r, label: r }))} />
        <TextInput label="FPS" name="fps" type="number" min={1} max={240} defaultValue={values.fps} required />
        <TextInput label="Format" name="format" defaultValue={values.format} required maxLength={60} hint="e.g. MP4 (H.264)" />
        <TextInput label="Clips" name="clipCount" type="number" min={0} defaultValue={values.clipCount} required />
        <TextInput label="File size" name="fileSize" type="number" min={0} step="0.01" defaultValue={values.fileSize ?? ""} />
        <SelectInput label="Unit" name="fileSizeUnit" defaultValue={values.fileSizeUnit} options={[{ value: "GB", label: "GB" }, { value: "MB", label: "MB" }]} />
        <TextInput label="Aspect ratio" name="aspectRatio" defaultValue={values.aspectRatio ?? ""} hint="e.g. 16:9" maxLength={20} />
        <TriState label="Audio included" name="hasAudio" value={values.hasAudio} />
      </Section>

      <Section title="Editing information" description="Only set what you know — unknown facts are hidden on the site.">
        <TriState label="Raw footage" name="isRaw" value={values.isRaw} />
        <TriState label="Clean footage" name="isClean" value={values.isClean} />
        <TriState label="Color graded" name="isColorGraded" value={values.isColorGraded} />
        <TriState label="Upscaled" name="isUpscaled" value={values.isUpscaled} />
        <TriState label="Watermarked" name="hasWatermark" value={values.hasWatermark} />
      </Section>

      <Section title="Download" description="Where visitors are sent when they click Download. The link is never shown in the page source.">
        <SelectInput label="Storage" name="storageProvider" value={provider} onChange={(e) => setProvider(e.target.value)} options={PROVIDERS} />
        {provider && !isBucket && (
          <TextInput label="Share link" name="downloadUrl" type="url" defaultValue={values.downloadUrl} placeholder="https://" wide />
        )}
        {provider && isBucket && <TextInput label="File path in bucket" name="objectId" defaultValue={values.objectId} placeholder="scenepacks/henry-hart-s5.zip" wide />}
        {provider && !isBucket && <input type="hidden" name="objectId" value="" />}
        {provider && isBucket && <input type="hidden" name="downloadUrl" value="" />}
        {provider && <TextInput label="Checksum" name="checksum" defaultValue={values.checksum} hint="Optional SHA-256 — helps catch duplicate uploads" maxLength={128} />}
      </Section>

      <Section title="Publishing">
        <SelectInput
          label="Status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "draft", label: "Draft — only admins can see it" },
            { value: "published", label: "Published" },
            { value: "scheduled", label: "Scheduled" },
            { value: "unpublished", label: "Unpublished — hidden" },
          ]}
        />
        {status === "scheduled" && <DateTimeInput label="Goes live at" name="publishAt" defaultValue={values.publishedAt} />}
        <TextInput label="Version" name="version" defaultValue={values.version} maxLength={20} hint="Change it when you replace the files" />
        {!isNew && <TextInput label="What changed in this version" name="versionNotes" maxLength={500} hint="Saved to version history when the version changes" />}
        {canFeature ? (
          <Toggle label="Featured on the homepage" name="featured" defaultChecked={values.featured} />
        ) : (
          <p className={styles.hint}>{values.featured ? "Featured (only administrators can change this)" : "Only administrators can feature ScenePacks"}</p>
        )}
      </Section>
    </AdminForm>
  );
}
