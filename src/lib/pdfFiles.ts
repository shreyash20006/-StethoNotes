import type { Note, PdfFileRef } from '../types';

export const normalizeStoragePath = (urlOrPath?: string): string => {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const marker = 'notes-pdfs/';
    const index = urlOrPath.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(urlOrPath.substring(index + marker.length));
    }

    try {
      const url = new URL(urlOrPath);
      const segments = url.pathname.split('/');
      const bucketIndex = segments.indexOf('notes-pdfs');
      if (bucketIndex !== -1 && bucketIndex < segments.length - 1) {
        return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
      }
    } catch {}
  }

  return urlOrPath;
};

export const getPdfFiles = (note?: Partial<Note> | null): PdfFileRef[] => {
  if (!note) return [];

  const files = Array.isArray(note.pdf_files) ? note.pdf_files : [];
  if (files.length > 0) {
    return files
      .filter((file): file is PdfFileRef => !!file && !!file.path)
      .map((file, index) => ({
        name: file.name || `PDF ${index + 1}.pdf`,
        path: normalizeStoragePath(file.path),
        size: Number(file.size) || 0,
        pages: Number(file.pages) || 0,
        order: Number(file.order) || index + 1
      }))
      .sort((a, b) => a.order - b.order);
  }

  if (note.pdf_url) {
    return [{
      name: `${note.title || 'Study file'}.pdf`,
      path: normalizeStoragePath(note.pdf_url),
      size: Number(note.file_size) || 0,
      pages: Number(note.page_count) || 0,
      order: 1
    }];
  }

  return [];
};

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 MB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
