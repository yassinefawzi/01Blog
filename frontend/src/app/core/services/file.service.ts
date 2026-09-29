import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { fileTypeFromBlob } from 'file-type';
import { environment } from '../../../environments/environment';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const FILE_TOO_LARGE_MESSAGE = 'File must be 50MB or smaller';
export const POST_MEDIA_MESSAGE = 'Only JPG, PNG, GIF, WebP, MP4, and WebM files are allowed';
export const AVATAR_MESSAGE = 'Only JPG, PNG, GIF, and WebP images are allowed';

export type UploadKind = 'IMAGE' | 'VIDEO';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm']);

export function mediaRejectionMessage(err: unknown, typeMessage: string): string | null {
  if (err instanceof Error && (err.message === 'file-too-large' || err.message === 'invalid-media')) {
    return err.message === 'file-too-large' ? FILE_TOO_LARGE_MESSAGE : typeMessage;
  }
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as { message?: string } | null)?.message;
    if (typeof message === 'string' && message.toLowerCase().includes('50mb')) return FILE_TOO_LARGE_MESSAGE;
    if (err.url?.includes('/files/upload') || err.url?.includes('/avatar')) return typeMessage;
  }
  return null;
}

export async function detectAllowedMedia(file: File, imagesOnly: boolean): Promise<UploadKind | null> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('file-too-large');
  }
  const detected = await fileTypeFromBlob(file);
  if (!detected) return null;

  if (IMAGE_MIME.has(detected.mime)) {
    return await canDecodeImage(file) ? 'IMAGE' : null;
  }
  if (!imagesOnly && VIDEO_MIME.has(detected.mime)) {
    return await canDecodeVideo(file) ? 'VIDEO' : null;
  }
  return null;
}

function canDecodeImage(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

function canDecodeVideo(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), 4000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => finish(video.videoWidth > 0 || video.duration > 0);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private http: HttpClient) {}

  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string; mediaType: string }>(
      `${environment.apiUrl}/files/upload`, form
    );
  }
}
