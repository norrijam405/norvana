"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_DEMO_PHOTOS, MAX_DEMO_PHOTO_BYTES, photoMetadataError, photoSignatureMatches,
  canPublishDemoPhotos, assignPhotoToDraftItem, approveAssignedPhoto, eligiblePhotoCount, revokeStalePhotoAssignments, type AssignedDemoPhoto,
} from "@/lib/garage-sale/photo-review";

import type { DraftItem } from "@/lib/garage-sale/drafts";
type LocalPhoto = AssignedDemoPhoto & { url: string };
export function PhotoReviewWorkbench({ items = [], onPhotosChange }: { items?: DraftItem[]; onPhotosChange?: (photos: AssignedDemoPhoto[]) => void }) {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [notices, setNotices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);
  const entries = useRef<LocalPhoto[]>([]);
  const selector = useRef<HTMLInputElement>(null);
  useEffect(() => {
    return () => { for (const url of urls.current) URL.revokeObjectURL(url); };
  }, []);

  // Share review metadata only; never share local image blob URLs with the summary.
  useEffect(() => {
    onPhotosChange?.(photos.map(({ id, name, size, type, approved, itemId }) => ({ id, name, size, type, approved, itemId })));
  }, [photos, onPhotosChange]);

  // Removing/changing an approved item invalidates any linked photo approval.
  useEffect(() => {
    const next = revokeStalePhotoAssignments(entries.current, items);
    if (next.some((photo, index) => photo !== entries.current[index])) {
      entries.current = next;
      setPhotos(next);
    }
  }, [items]);

  async function addPhotos(selected: FileList | null) {
    if (!selected || busy) return;
    setBusy(true);
    const issues: string[] = [];
    const next: LocalPhoto[] = [];
    const fingerprints = new Set(entries.current.map(photo => `${photo.name.toLowerCase()}:${photo.size}`));
    try {
      for (const file of Array.from(selected)) {
        if (entries.current.length + next.length >= MAX_DEMO_PHOTOS) {
          issues.push(`Only ${MAX_DEMO_PHOTOS} photos can be reviewed in the demo.`);
          break;
        }
        const err = photoMetadataError(file);
        if (err) { issues.push(`${file.name.slice(0, 70)}: ${err}`); continue; }
        const key = `${file.name.toLowerCase()}:${file.size}`;
        if (fingerprints.has(key)) { issues.push(`${file.name.slice(0, 70)}: already in this review.`); continue; }
        // Parse only the header; don't upload a file or copy its full bytes to app state.
        const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
        if (!photoSignatureMatches(bytes, file.type)) {
          issues.push(`${file.name.slice(0, 70)}: image signature does not match its declared type.`);
          continue;
        }
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        fingerprints.add(key);
        next.push({ id: `demo-photo-${Date.now()}-${entries.current.length + next.length}`, name: file.name, size: file.size, type: file.type, approved: false, itemId: null, url });
      }
      if (next.length) {
        const merged = [...entries.current, ...next];
        entries.current = merged;
        setPhotos(merged);
      }
      setNotices(issues);
    } catch {
      setNotices(["Could not inspect one or more selected files. Nothing was uploaded."]);
    } finally {
      setBusy(false);
      if (selector.current) selector.current.value = "";
    }
  }
  function remove(id: string) {
    const photo = entries.current.find(photo => photo.id === id);
    if (photo) {
      URL.revokeObjectURL(photo.url);
      urls.current = urls.current.filter(url => url !== photo.url);
    }
    const next = entries.current.filter(photo => photo.id !== id);
    entries.current = next;
    setPhotos(next);
  }
  function update(id: string, approved: boolean) {
    const next = approveAssignedPhoto(entries.current, id, approved, items);
    entries.current = next;
    setPhotos(next);
  }
  function assign(id: string, itemId: string | null) {
    const next = assignPhotoToDraftItem(entries.current, id, itemId, items);
    entries.current = next;
    setPhotos(next);
  }
  function clear() {
    urls.current.forEach(url => URL.revokeObjectURL(url));
    urls.current = [];
    entries.current = [];
    setPhotos([]);
    setNotices([]);
  }
  const approvedCount = eligiblePhotoCount(photos, items);
  const approvedItems = items.filter(item => item.approved);
  return <section className="mt-7 rounded-[2rem] border border-soil/10 bg-cream p-6 md:p-9" aria-labelledby="garage-photo-title">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf">Seller studio · photo intake experiment</p>
    <h2 id="garage-photo-title" className="mt-2 font-display text-3xl font-black">Review photos before showing them.</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
      This Preview keeps selected images on your device in this browser tab only. Photos are not uploaded, saved,
      moderated, published or stripped of location metadata. Use fictional or non-sensitive test pictures.
    </p>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center rounded-xl bg-leaf px-5 py-3 text-sm font-bold text-white">
        Choose demo photos
        <input ref={selector} type="file" accept="image/jpeg,image/png,image/webp" multiple
          className="sr-only" onChange={event => { void addPhotos(event.target.files); }} disabled={busy} />
      </label>
      <button type="button" onClick={clear} disabled={!photos.length}
        className="rounded-xl border border-soil/20 px-5 py-3 text-sm font-semibold disabled:opacity-40">
        Clear local photos
      </button>
    </div>
    <p className="mt-3 text-xs text-muted">Up to {MAX_DEMO_PHOTOS} images, {Math.round(MAX_DEMO_PHOTO_BYTES / (1024 * 1024))} MB each. JPEG, PNG or WebP only. Server upload is disabled.</p>
    {notices.length > 0 && <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-soil">
      {notices.map((notice, index) => <p key={index}>{notice}</p>)}
    </div>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map(photo => <article key={photo.id} className="overflow-hidden rounded-2xl border border-soil/10 bg-bone p-3">
        {/* Blob URLs are local to this browser tab; do not relay them to an API. */}
        <img src={photo.url} alt={photo.name} className="h-40 w-full rounded-xl bg-sage-wash object-contain" />
        <p title={photo.name} className="mt-3 truncate text-sm font-semibold">{photo.name}</p>
        <p className="mt-1 text-xs text-muted">{(photo.size / 1024).toFixed(0)} KB · {photo.type}</p>
        <label className="mt-3 block text-sm font-semibold">
          Associate with approved item
          <select value={approvedItems.some(item => item.id === photo.itemId) ? photo.itemId ?? "" : ""} onChange={event => assign(photo.id, event.target.value || null)}
            className="mt-2 w-full rounded-lg border border-soil/20 bg-cream px-3 py-2 text-sm">
            <option value="">Unassigned · select an item</option>
            {approvedItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={photo.approved && approvedItems.some(item => item.id === photo.itemId)} disabled={!approvedItems.some(item => item.id === photo.itemId)} onChange={event => update(photo.id, event.target.checked)} className="h-4 w-4 accent-leaf" />
          Approve photo for the selected item
        </label>
        <button type="button" onClick={() => remove(photo.id)} className="mt-3 text-xs font-semibold text-clay underline underline-offset-2">Remove photo</button>
      </article>)}
    </div>
    <p role="status" className="mt-5 rounded-xl bg-sage-wash p-4 text-sm">
      <strong>{approvedCount} of {photos.length} photos approved for currently approved items.</strong> Publish authorization: {canPublishDemoPhotos(photos) ? "Available" : "DISABLED"}.
      <span className="mt-1 block text-xs text-muted">A future real upload needs server-side file scanning, metadata removal, seller authorization, storage isolation and a moderation queue.</span>
    </p>
  </section>;
}
