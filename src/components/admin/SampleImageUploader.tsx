import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, GripVertical, ArrowLeft, ArrowRight, Replace, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  compressImage,
  MAX_SAMPLE_IMAGES,
  revokePreviewUrl,
  type CompressedImage,
} from '../../lib/imageUtils';

export interface SampleImageItem extends CompressedImage {
  id: string;
  isCover?: boolean;
}

interface SampleImageUploaderProps {
  coverImage: SampleImageItem | null;
  sampleImages: SampleImageItem[];
  onCoverChange: (item: SampleImageItem | null) => void;
  onSamplesChange: (items: SampleImageItem[]) => void;
  disabled?: boolean;
}

async function processFiles(files: File[]): Promise<SampleImageItem[]> {
  const results: SampleImageItem[] = [];
  for (const file of files) {
    const compressed = await compressImage(file);
    results.push({
      ...compressed,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  }
  return results;
}

export default function SampleImageUploader({
  coverImage,
  sampleImages,
  onCoverChange,
  onSamplesChange,
  disabled = false,
}: SampleImageUploaderProps) {
  const [processing, setProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onCoverDrop = useCallback(async (accepted: File[]) => {
    if (!accepted[0]) return;
    setProcessing(true);
    try {
      if (coverImage) revokePreviewUrl(coverImage.previewUrl);
      const [item] = await processFiles([accepted[0]]);
      onCoverChange({ ...item, isCover: true });
    } finally {
      setProcessing(false);
    }
  }, [coverImage, onCoverChange]);

  const onSamplesDrop = useCallback(async (accepted: File[]) => {
    const slotsLeft = MAX_SAMPLE_IMAGES - sampleImages.length;
    if (slotsLeft <= 0) return;
    setProcessing(true);
    try {
      const newItems = await processFiles(accepted.slice(0, slotsLeft));
      onSamplesChange([...sampleImages, ...newItems]);
    } finally {
      setProcessing(false);
    }
  }, [sampleImages, onSamplesChange]);

  const coverDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: disabled || processing,
    onDrop: onCoverDrop,
  });

  const samplesDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: MAX_SAMPLE_IMAGES,
    disabled: disabled || processing,
    onDrop: onSamplesDrop,
  });

  const moveSample = (index: number, direction: 'left' | 'right') => {
    const next = direction === 'left' ? index - 1 : index + 1;
    if (next < 0 || next >= sampleImages.length) return;
    const updated = [...sampleImages];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    onSamplesChange(updated);
  };

  const removeSample = (index: number) => {
    revokePreviewUrl(sampleImages[index].previewUrl);
    onSamplesChange(sampleImages.filter((_, i) => i !== index));
  };

  const replaceSample = async (index: number, file: File) => {
    setProcessing(true);
    try {
      revokePreviewUrl(sampleImages[index].previewUrl);
      const [item] = await processFiles([file]);
      const updated = [...sampleImages];
      updated[index] = item;
      onSamplesChange(updated);
    } finally {
      setProcessing(false);
    }
  };

  const handleReorder = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    const updated = [...sampleImages];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onSamplesChange(updated);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {processing && (
        <div className="flex items-center gap-2 text-xs text-cyan-600 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Compressing images...</span>
        </div>
      )}

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Cover Image <span className="text-red-400">*</span>
        </label>
        <div
          {...coverDropzone.getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            coverImage ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-400 bg-white'
          }`}
        >
          <input {...coverDropzone.getInputProps()} />
          {coverImage ? (
            <div className="relative inline-block">
              <img src={coverImage.previewUrl} alt="Cover" className="h-32 rounded-xl object-cover shadow-md mx-auto" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); revokePreviewUrl(coverImage.previewUrl); onCoverChange(null); }}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <p className="text-[10px] text-slate-500 mt-2">Click or drag to replace</p>
            </div>
          ) : (
            <>
              <Upload className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Upload Cover Image</p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP · Drag & drop supported</p>
            </>
          )}
        </div>
      </div>

      {/* Sample Pages */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sample Pages <span className="text-slate-300 font-normal">(Optional)</span>
          </label>
          <span className="text-[10px] text-slate-400">{sampleImages.length} / {MAX_SAMPLE_IMAGES}</span>
        </div>

        <div
          {...samplesDropzone.getRootProps()}
          className="border-2 border-dashed border-slate-200 hover:border-cyan-400 bg-white rounded-2xl p-6 text-center cursor-pointer transition-colors"
        >
          <input {...samplesDropzone.getInputProps()} />
          <ImageIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Upload Multiple Sample Images</p>
          <p className="text-[10px] text-slate-400 mt-1">Multi-select · Drag & drop · Max {MAX_SAMPLE_IMAGES} images</p>
        </div>

        {sampleImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl max-h-80 overflow-y-auto">
            {sampleImages.map((img, i) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => setDraggedIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleReorder(i)}
                className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 bg-white shadow-sm transition-all ${
                  draggedIndex === i ? 'border-cyan-400 opacity-50' : 'border-slate-100 hover:border-cyan-300'
                }`}
              >
                <img src={img.previewUrl} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-white drop-shadow" />
                  <span className="bg-slate-900/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveSample(i, 'left')} disabled={i === 0} className="p-1 bg-white/90 rounded disabled:opacity-30">
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <label className="p-1 bg-white/90 rounded cursor-pointer">
                    <Replace className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && replaceSample(i, e.target.files[0])} />
                  </label>
                  <button type="button" onClick={() => removeSample(i)} className="p-1 bg-red-500/90 text-white rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveSample(i, 'right')} disabled={i === sampleImages.length - 1} className="p-1 bg-white/90 rounded disabled:opacity-30">
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
