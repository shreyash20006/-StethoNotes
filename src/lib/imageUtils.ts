// Image compression, optimization, and upload helpers
import { useEffect, useState } from 'react';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SAMPLE_IMAGES = 20;
const MAX_IMAGE_DIMENSION = 2400;
const DEFAULT_JPEG_QUALITY = 0.85;

export { ACCEPTED_IMAGE_TYPES, MAX_SAMPLE_IMAGES };

export interface CompressedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

/** Compress an image file using canvas — works on all browsers including in-app WebViews */
export async function compressImage(
  file: File,
  maxDimension = MAX_IMAGE_DIMENSION,
  quality = DEFAULT_JPEG_QUALITY
): Promise<CompressedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only PNG, JPG, JPEG, and WEBP images are supported.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      outputType,
      quality
    );
  });

  const ext = outputType === 'image/png' ? 'png' : 'jpg';
  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), {
    type: outputType,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
  };
}

const SUPABASE_STORAGE_HOSTS = ['supabase.co/storage/v1/object', 'supabase.in/storage/v1/object'];

/** Detect whether a URL points to Supabase Storage */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return SUPABASE_STORAGE_HOSTS.some(h => url.includes(h));
}

const DPR_WIDTH_MAP: Record<number, number> = { 1: 800, 2: 1200, 3: 1600 };

export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 3);
}

/** Apply Cloudinary-style / Supabase transforms depending on the host, otherwise return as-is */
export function optimizeImageUrl(
  url: string,
  opts: { width?: number; quality?: string; blur?: boolean; dpr?: boolean } = {}
): string {
  if (!url) return url;
  const { width = 800, quality = 'auto', blur = false, dpr = false } = opts;
  const targetWidth = dpr ? (DPR_WIDTH_MAP[getDevicePixelRatio()] || width) : width;

  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transforms = [`w_${targetWidth}`, `q_${quality}`, 'f_auto', 'c_limit'];
      if (blur) transforms.push('e_blur:200');
      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    }
  }

  if (url.includes('unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${targetWidth}&q=${quality === 'auto' ? 80 : quality}&auto=format&fit=crop`;
  }

  if (isSupabaseStorageUrl(url)) {
    const params = new URLSearchParams();
    params.set('width', String(targetWidth));
    if (quality !== 'auto') params.set('quality', String(quality));
    else params.set('quality', '80');
    if (blur) params.set('blur', '20');
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${params.toString()}`;
  }

  return url;
}

/** Return the best possible URL for the given context (width/quality) */
export function getOptimizedImageUrl(url: string, width = 800, dpr = false): string {
  return optimizeImageUrl(url, { width, dpr });
}

/** Generate a tiny blur placeholder data URL */
export async function generateBlurPlaceholder(file: File): Promise<string> {
  const compressed = await compressImage(file, 32, 0.5);
  return compressed.previewUrl;
}

/** Build standardized storage path: {userId}/products/{uuid}/{type}_{index}.ext */
export function buildImageStoragePath(
  userId: string,
  productUuid: string,
  type: 'cover' | 'sample',
  index?: number,
  ext = 'jpg'
): string {
  if (type === 'cover') {
    return `${userId}/products/${productUuid}/cover.${ext}`;
  }
  return `${userId}/products/${productUuid}/sample_${String(index ?? 0).padStart(2, '0')}.${ext}`;
}

export function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export function revokePreviewUrl(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

interface BlurPlaceholderState {
  blurUrl: string | null;
  loaded: boolean;
}

/** Build a tiny blurred placeholder from a File or a remote URL */
export async function createBlurPlaceholder(source: File | string): Promise<string> {
  if (typeof source === 'string') {
    if (source.startsWith('blob:')) {
      const res = await fetch(source);
      const blob = await res.blob();
      return generateBlurPlaceholder(new File([blob], 'src', { type: blob.type }));
    }
    return optimizeImageUrl(source, { width: 24, blur: true });
  }
  return generateBlurPlaceholder(source);
}

/** React hook: show a blurred placeholder while the main image loads (works with File or URL) */
export function useBlurPlaceholder(source: File | string | null): BlurPlaceholderState {
  const [blurUrl, setBlurUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBlurUrl(null);
    if (source) {
      createBlurPlaceholder(source)
        .then(url => { if (!cancelled) setBlurUrl(url); })
        .catch(() => { if (!cancelled) setBlurUrl(null); });
    }

    return () => { cancelled = true; };
  }, [source]);

  return { blurUrl, loaded: !!blurUrl };
}

export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if (!src) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          target.src = src;
          target.removeAttribute('data-lazy');
          observer.unobserve(target);
        }
      });
    },
    { rootMargin: '200px 0px' }
  );
  observer.observe(img);
}

export function setupLazyImages(container: HTMLElement | Document = document): () => void {
  const images = container.querySelectorAll('img[data-lazy]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-lazy');
          if (src) {
            img.src = src;
            img.removeAttribute('data-lazy');
          }
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '300px 0px' }
  );

  images.forEach((img) => observer.observe(img));

  return () => observer.disconnect();
}
