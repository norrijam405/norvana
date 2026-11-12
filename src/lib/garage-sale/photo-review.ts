/**
 * Garage Sale R2 photo review: browser-only intake, NEVER an upload endpoint.
 * No server storage, no EXIF parsing, no transmission and no publishing.
 * Real use requires separate upload scanning, metadata stripping and authorization.
 */
export const MAX_DEMO_PHOTOS = 6;
export const MAX_DEMO_PHOTO_BYTES = 5 * 1024 * 1024;
export type DemoPhoto = { id: string; name: string; size: number; type: string; approved: boolean };
export type PhotoCandidate = { name: string; size: number; type: string };
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function photoMetadataError(candidate: PhotoCandidate): string | null {
  if (!candidate.name || candidate.name.length > 180 || /[\\/\u0000-\u001f]/.test(candidate.name)) return "Invalid image filename.";
  if (!PHOTO_TYPES.has(candidate.type)) return "Use JPEG, PNG or WebP images only.";
  if (!Number.isSafeInteger(candidate.size) || candidate.size < 16 || candidate.size > MAX_DEMO_PHOTO_BYTES)
    return "Each image must be between 16 bytes and 5 MB.";
  return null;
}

/** First-byte checks prevent merely renaming an SVG or HTML file to .jpg. */
export function photoSignatureMatches(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte);
  if (mime === "image/webp") return bytes.length >= 12
    && [82,73,70,70].every((byte, index) => bytes[index] === byte)
    && [87,69,66,80].every((byte, index) => bytes[index + 8] === byte);
  return false;
}
export function changePhotoApproval(photos: DemoPhoto[], id: string, approved: boolean): DemoPhoto[] {
  return photos.map(photo => photo.id === id ? { ...photo, approved } : photo);
}
export function canPublishDemoPhotos(_photos: DemoPhoto[]): false {
  // A local preview approval is never a publish authorization.
  return false;
}
