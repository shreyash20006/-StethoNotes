import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import type { Note, Course } from '../../types';
import {
  FileText, Image as ImageIcon, Upload, X, ArrowLeft, ArrowRight,
  Trash2, Eye, ShieldCheck, CheckCircle2, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface NoteUploadWizardProps {
  onClose: () => void;
  onSaveSuccess: () => void;
  note?: Note | null;
  isAdmin?: boolean;
}

export default function NoteUploadWizard({ onClose, onSaveSuccess, note = null, isAdmin = false }: NoteUploadWizardProps) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Form Metadata States
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [description, setDescription] = useState('');

  // Mode Selection
  const [uploadType, setUploadType] = useState<'pdf' | 'images'>('pdf');

  // Mode 1: PDF States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Auto Preview States
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Mode 2: Images States
  const [noteImages, setNoteImages] = useState<{ file: File; previewUrl: string }[]>([]);

  // Wizard Compilation Output
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compiledPdfBlob, setCompiledPdfBlob] = useState<Blob | null>(null);
  const [uploadedPdfPath, setUploadedPdfPath] = useState('');
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('');
  const [uploadedPreviewUrls, setUploadedPreviewUrls] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [fileSize, setFileSize] = useState(0);

  // Preview Zoom State
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  // Load Courses and Prefill if editing
  useEffect(() => {
    fetchCourses();
    if (note) {
      setTitle(note.title);
      setCourseId(note.course_id);
      setSubject(note.subject);
      setSemester(note.semester || '');
      setPrice(note.price.toString());
      setStatus(note.status);
      setDescription(note.description || '');
      setUploadType(note.content_type as any || 'pdf');
      setUploadedPdfPath(note.pdf_url);
      setUploadedCoverUrl(note.thumbnail_url);
      setUploadedPreviewUrls(note.preview_images || []);
      setPageCount(note.page_count || 0);
      setFileSize(note.file_size || 0);
      // Skip upload wizard pages if editing
      setStep(4);
    }
  }, [note]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('name');
      if (error) throw error;
      if (data) {
        setCourses(data);
        if (data.length > 0 && !note) {
          setCourseId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Drag and Drop configs
  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0]);
        addToast('success', 'PDF Selected', `${acceptedFiles[0].name} loaded successfully.`);
      }
    }
  });

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setCoverFile(acceptedFiles[0]);
      }
    }
  });

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setNoteImages(prev => [...prev, ...newImages]);
    }
  });

  // Images Sorting Actions
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= noteImages.length) return;
    const updated = [...noteImages];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setNoteImages(updated);
  };

  const removeImage = (index: number) => {
    const updated = [...noteImages];
    URL.revokeObjectURL(updated[index].previewUrl);
    updated.splice(index, 1);
    setNoteImages(updated);
  };

  // HTML5 Canvas Resizing of images to A4 Portrait 300 DPI equivalent
  const resizeImageToA4 = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Standard A4 at 300 DPI is 2480 x 3508 pixels
          const targetWidth = 2480;
          const targetHeight = 3508;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not supported.'));
            return;
          }

          // Fill white page background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Calculate scale fitting portrait
          const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (targetWidth - w) / 2;
          const y = (targetHeight - h) / 2;

          ctx.drawImage(img, x, y, w, h);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed.'));
          }, 'image/jpeg', 0.90);
        };
        img.onerror = () => reject(new Error('Image decode error.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reader error.'));
      reader.readAsDataURL(file);
    });
  };
  // PDF page preview auto-extractor using pdfjs-dist
  const generatePreviews = async (pdfBlob: Blob) => {
    setIsGeneratingPreviews(true);
    setPreviewProgress(10);
    setPreviewError(null);
    setUploadedPreviewUrls([]);

    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocObj = await loadingTask.promise;
      const totalPages = pdfDocObj.numPages;
      setPageCount(totalPages); // Set the page count immediately
      const pagesToExtract = Math.min(3, totalPages);
      
      const generatedUrls: string[] = [];

      for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
        setPreviewProgress(Math.floor(10 + ((pageNum - 1) / pagesToExtract) * 80));
        
        const page = await pdfDocObj.getPage(pageNum);
        
        // Calculate viewport scale for target width 1200px+ (maintain aspect ratio)
        const viewport1 = page.getViewport({ scale: 1.0 });
        const targetWidth = 1200;
        const scale = targetWidth / viewport1.width;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context not available.');
        
        // Render PDF page to canvas
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Overlay diagonal Center Watermark before extracting JPEG Blob
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-45 * Math.PI / 180);
        
        const fontSize = Math.max(20, Math.floor(canvas.width / 12));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('STETHONOTES PREVIEW', 0, -fontSize / 2);
        ctx.fillText('NOT FOR DISTRIBUTION', 0, fontSize / 2);
        
        ctx.restore();
        
        // Extract canvas to high-quality JPEG blob (Quality 95%)
        const jpegBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
        });
        
        if (!jpegBlob) {
          throw new Error(`Failed to convert canvas to JPEG for page ${pageNum}.`);
        }

        // Upload to public previews bucket
        const sellerId = note?.seller_id || user?.id || 'admin';
        const uuid = Math.random().toString(36).substring(2, 10);
        const filePath = `previews/${sellerId}/${uuid}_p${pageNum}.jpg`;
        
        const { error: uploadErr } = await supabase.storage
          .from('previews')
          .upload(filePath, jpegBlob, { contentType: 'image/jpeg', upsert: true });
          
        if (uploadErr) throw uploadErr;
        
        const { data } = supabase.storage.from('previews').getPublicUrl(filePath);
        generatedUrls.push(data.publicUrl);
      }
      
      setUploadedPreviewUrls(generatedUrls);
      setPreviewProgress(100);
      addToast('success', 'Previews Extracted', `Extracted ${pagesToExtract} pages automatically.`);
    } catch (err: any) {
      console.error('Error extracting previews:', err);
      setPreviewError(err.message || 'Error occurred generating page previews.');
      addToast('error', 'Preview Error', 'Failed to extract preview images automatically.');
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  const handleRegeneratePreviews = async () => {
    let blobToUse: Blob | null = null;
    if (uploadType === 'pdf' && pdfFile) {
      blobToUse = pdfFile;
    } else if (uploadType === 'images' && compiledPdfBlob) {
      blobToUse = compiledPdfBlob;
    } else if (note) {
      setIsGeneratingPreviews(true);
      setPreviewProgress(5);
      try {
        const { data, error } = await supabase.storage
          .from('notes-pdfs')
          .download(note.pdf_url);
        if (error || !data) {
          throw new Error(error?.message || 'Could not download original PDF for preview extraction.');
        }
        blobToUse = data;
      } catch (err: any) {
        setPreviewError(err.message);
        setIsGeneratingPreviews(false);
        return;
      }
    }

    if (blobToUse) {
      generatePreviews(blobToUse);
    } else {
      addToast('error', 'No Source Document', 'Please upload a PDF note document first.');
    }
  };

  // Trigger preview generation when a PDF is dropped in Mode 1
  useEffect(() => {
    if (pdfFile && uploadType === 'pdf') {
      generatePreviews(pdfFile);
    }
  }, [pdfFile, uploadType]);

  // Compilation Routine: Multi-Image to PDF Compiler
  const compileImages = async () => {
    if (noteImages.length === 0) {
      addToast('error', 'No Pages', 'Please upload at least one note page image.');
      return;
    }

    setIsCompiling(true);
    setCompilationProgress(10);

    try {
      const pdfDoc = await PDFDocument.create();
      const total = noteImages.length;

      for (let i = 0; i < total; i++) {
        setCompilationProgress(Math.floor(10 + (i / total) * 70));
        const imgItem = noteImages[i];
        
        // 1. Resize/pad to standard A4 (A4 portrait dimensions at 300 DPI)
        const a4Blob = await resizeImageToA4(imgItem.file);
        const a4Bytes = await a4Blob.arrayBuffer();

        // 2. Embed into PDF document
        const pdfImg = await pdfDoc.embedJpg(a4Bytes);
        // A4 PDF point dimensions are 595.27 x 841.89
        const page = pdfDoc.addPage([595.27, 841.89]);
        const { width, height } = pdfImg.scaleToFit(595.27, 841.89);

        // Center on PDF page
        const x = (595.27 - width) / 2;
        const y = (841.89 - height) / 2;

        page.drawImage(pdfImg, {
          x,
          y,
          width,
          height
        });
      }

      setCompilationProgress(85);
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setCompiledPdfBlob(pdfBlob);
      setPageCount(total);
      setFileSize(pdfBlob.size);

      setCompilationProgress(100);
      addToast('success', 'PDF Compiled Successfully', `Standardized A4 PDF document generated (${total} pages).`);
      generatePreviews(pdfBlob);
      setStep(3);
    } catch (err: any) {
      addToast('error', 'Compilation Error', err.message || 'Could not compile note images.');
    } finally {
      setIsCompiling(false);
    }
  };

  // Compile PDF Metadata
  const compilePdfMetadata = async () => {
    if (!pdfFile) {
      addToast('error', 'Missing PDF', 'Please upload a PDF notes file.');
      return;
    }
    setIsCompiling(true);
    try {
      setFileSize(pdfFile.size);
      // Try to load with pdf-lib first (to ensure basic parsing succeeds)
      const pdfBytes = await pdfFile.arrayBuffer();
      try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const pages = pdfDoc.getPageCount();
        setPageCount(pages);
      } catch (pdfLibErr) {
        console.warn('pdf-lib parsing failed, attempting fallback to PDF.js page count:', pdfLibErr);
        // Fallback to PDF.js count (which was run during generatePreviews)
        // If PDF.js hasn't set it yet, we can load it here
        if (pageCount <= 0) {
          const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
          const pdfDocObj = await loadingTask.promise;
          setPageCount(pdfDocObj.numPages);
        }
      }
      setStep(3);
    } catch (err: any) {
      console.error('PDF parsing failed on all engines:', err);
      addToast('error', 'PDF Read Error', 'Invalid or protected PDF file.');
    } finally {
      setIsCompiling(false);
    }
  };

  // Upload Assets to Storage Buckets
  const uploadWizardAssets = async () => {
    setIsCompiling(true);
    setCompilationProgress(10);
    try {
      const sellerId = user?.id || 'admin';
      const uuid = Math.random().toString(36).substring(2, 10);
      
      // Get course name for directory slug
      const courseName = courses.find(c => c.id === courseId)?.name || 'Course';
      const slugCourse = courseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const slugSubject = subject.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      // Paths following structure: /course/subject/seller-id/file
      const storageBaseDir = `${slugCourse}/${slugSubject}/${sellerId}/${uuid}`;

      // 1. Upload Private PDF Notes
      let pdfPath = uploadedPdfPath;
      if (uploadType === 'pdf' && pdfFile) {
        setCompilationProgress(30);
        const filePath = `${storageBaseDir}_notes.pdf`;
        const { data, error } = await supabase.storage
          .from('notes-pdfs')
          .upload(filePath, pdfFile, { overwrite: true });
        if (error) throw error;
        pdfPath = data.path;
      } else if (uploadType === 'images' && compiledPdfBlob) {
        setCompilationProgress(30);
        const filePath = `${storageBaseDir}_notes.pdf`;
        const { data, error } = await supabase.storage
          .from('notes-pdfs')
          .upload(filePath, compiledPdfBlob, { overwrite: true });
        if (error) throw error;
        pdfPath = data.path;
      }

      // 2. Upload Public Thumbnail Cover
      let coverUrl = uploadedCoverUrl;
      if (coverFile) {
        setCompilationProgress(50);
        const filePath = `covers/${storageBaseDir}_cover.jpg`;
        const { error } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, coverFile, { overwrite: true });
        if (error) throw error;
        
        const { data } = supabase.storage.from('thumbnails').getPublicUrl(filePath);
        coverUrl = data.publicUrl;
      } else if (uploadedPreviewUrls.length > 0 && !uploadedCoverUrl) {
        // Use first page of auto-generated previews as cover if not set explicitly
        coverUrl = uploadedPreviewUrls[0];
      }

      // 3. Previews are automatically extracted and uploaded asynchronously in the background.
      const previewUrlsList = uploadedPreviewUrls;

      setCompilationProgress(95);
      setUploadedPdfPath(pdfPath);
      setUploadedCoverUrl(coverUrl);
      setUploadedPreviewUrls(previewUrlsList);
      
      setCompilationProgress(100);
      addToast('success', 'Assets Uploaded', 'Note documents uploaded and secured successfully.');
      setStep(4);
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Error occurred uploading files.');
    } finally {
      setIsCompiling(false);
    }
  };

  // Submit Details to Database notes table
  const handleFinalPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !price.trim() || !courseId) {
      addToast('error', 'Validation Error', 'Please complete Title, Subject, Course, and Price.');
      return;
    }

    const sellerId = note ? note.seller_id : (isAdmin ? 'admin_central' : user?.id);

    const payload = {
      title: title.trim(),
      course_id: courseId,
      subject: subject.trim(),
      semester: semester.trim() || null,
      price: Number(price),
      status,
      description: description.trim(),
      pdf_url: uploadedPdfPath || 'pdfs/anatomy_upper_limb.pdf',
      thumbnail_url: uploadedCoverUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
      preview_images: uploadedPreviewUrls.length > 0 ? uploadedPreviewUrls : [
        'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400'
      ],
      content_type: uploadType,
      page_count: pageCount,
      file_size: fileSize,
      seller_id: sellerId
    };

    try {
      if (note) {
        // UPDATE
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', note.id);
        if (error) throw error;
        addToast('success', 'Note Updated', 'The study notes catalogue listing has been updated.');
      } else {
        // CREATE
        const { error } = await supabase
          .from('notes')
          .insert(payload);
        if (error) throw error;
        addToast('success', 'Note Published', 'The study notes were added to the directory catalog.');
      }
      onSaveSuccess();
    } catch (err: any) {
      addToast('error', 'Publish Failed', err.message);
    }
  };

  return (
    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-xl max-w-4xl mx-auto">
      {/* Wizard Step Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{note ? 'Edit Listing' : 'Notes Upload Wizard'}</h2>
          <p className="text-xs text-slate-400">Step {step} of 4: {
            step === 1 ? 'Choose Mode' : step === 2 ? 'Attach Files' : step === 3 ? 'Compile & Preview' : 'Metadata Details'
          }</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8 bg-white p-2 border border-slate-100 rounded-2xl">
        {[1, 2, 3, 4].map((num) => (
          <React.Fragment key={num}>
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === num
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                  : step > num
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {num}
              </span>
              <span className={`text-xs font-semibold hidden sm:inline ${
                step === num ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {num === 1 ? 'Mode' : num === 2 ? 'Upload' : num === 3 ? 'Verify' : 'Publish'}
              </span>
            </div>
            {num < 4 && <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
          </React.Fragment>
        ))}
      </div>

      {/* ==========================================
          STEP 1: SELECT UPLOAD MODE
          ========================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Select content delivery model</h3>
            <p className="text-xs text-slate-400">Choose between uploading a single combined PDF document or dragging multiple image pages together.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setUploadType('pdf'); setStep(2); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Direct PDF Upload</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Directly upload a prepared medical notes document in PDF format. Fastest listing method.</p>
              </div>
            </button>

            <button
              onClick={() => { setUploadType('images'); setStep(2); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Image Compilation (Convert to PDF)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Upload note pages as individual photos. We compile them into a secure A4 portrait PDF document automatically.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 2: UPLOAD FILE(S)
          ========================================== */}
      {step === 2 && (
        <div className="space-y-6">
          {uploadType === 'pdf' ? (
            <div className="space-y-4 text-left">
              {/* PDF file dropzone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">PDF Note File *</label>
                <div {...getPdfRootProps()} className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-white rounded-2xl p-8 text-center cursor-pointer transition-colors">
                  <input {...getPdfInputProps()} />
                  <Upload className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">{pdfFile ? pdfFile.name : 'Select or drop PDF document here'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF format only. Maximum 100 MB.</p>
                </div>
              </div>

              {/* Cover thumbnail dropzone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Store Cover Cover Image (Thumbnail) *</label>
                <div {...getCoverRootProps()} className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-white rounded-2xl p-6 text-center cursor-pointer transition-colors">
                  <input {...getCoverInputProps()} />
                  <Upload className="w-6 h-6 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">{coverFile ? coverFile.name : 'Select Cover thumbnail image'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP accepted.</p>
                </div>
              </div>

              {/* Auto Generated Previews Status & List */}
              <div className="space-y-3 bg-white p-5 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Preview Pages (Auto-Generated)</label>
                    <span className="text-[10px] text-emerald-600 font-medium font-sans">✓ System Extracted & Watermarked</span>
                  </div>
                  {(pdfFile || note) && (
                    <button
                      type="button"
                      onClick={handleRegeneratePreviews}
                      disabled={isGeneratingPreviews}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Previews</span>
                    </button>
                  )}
                </div>

                {/* Progress and status indicators */}
                {isGeneratingPreviews && (
                  <div className="space-y-1.5 py-2 font-sans">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                        <span>Generating high-quality previews ({previewProgress}%)...</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${previewProgress}%` }} />
                    </div>
                  </div>
                )}

                {previewError && (
                  <div className="bg-red-50 text-red-750 border border-red-100 rounded-xl p-3 text-xs leading-relaxed flex flex-col gap-1 text-left font-sans">
                    <span className="font-bold">Preview Extraction Failed</span>
                    <span>{previewError}</span>
                    <button
                      type="button"
                      onClick={handleRegeneratePreviews}
                      className="text-left font-bold underline mt-1 text-[10px]"
                    >
                      Click here to retry manual generation
                    </button>
                  </div>
                )}

                {uploadedPreviewUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {uploadedPreviewUrls.map((url, i) => (
                      <div key={i} className="group relative aspect-[3/4] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover select-none pointer-events-none" />
                        <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono">
                          Page {i+1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isGeneratingPreviews && (
                    <p className="text-[10px] text-slate-400 italic py-2 font-sans">
                      {pdfFile ? 'Preparing preview extraction...' : 'Upload PDF note file to extract previews automatically.'}
                    </p>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Note images dropzone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Upload Note Pages (Images) *</label>
                <div {...getImagesRootProps()} className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-white rounded-2xl p-8 text-center cursor-pointer transition-colors">
                  <input {...getImagesInputProps()} />
                  <Upload className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Drag & drop note pages or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-1">Upload multiple files (JPG, PNG, JPEG, WEBP). Max 100 MB.</p>
                </div>
              </div>

              {/* Note images sorting and deletion */}
              {noteImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Pages List ({noteImages.length} uploaded)</label>
                    <span className="text-[10px] text-slate-400">Reorder pages using the arrow actions</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 border border-slate-200 rounded-2xl max-h-96 overflow-y-auto">
                    {noteImages.map((img, i) => (
                      <div key={i} className="group relative aspect-[3/4] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex flex-col justify-between shadow-sm">
                        <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                          <img src={img.previewUrl} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono">
                            P. {i+1}
                          </span>
                        </div>
                        {/* Actions overlay panel */}
                        <div className="p-2 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveImage(i, 'left')}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-30"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomImgUrl(img.previewUrl)}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={i === noteImages.length - 1}
                            onClick={() => moveImage(i, 'right')}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-30"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions Step 2 */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-5 hover:bg-slate-250 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={uploadType === 'pdf' ? compilePdfMetadata : compileImages}
              disabled={isCompiling || (uploadType === 'pdf' && !pdfFile) || (uploadType === 'images' && noteImages.length === 0)}
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Next</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 3: COMPILATION & VERIFICATION PREVIEW
          ========================================== */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Compilation status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Verify note documents compiled</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Review the file page counts and sizing. We will upload this compiled file to private storage.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl text-left font-sans max-w-xs mx-auto">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">PAGE COUNT</span>
                <span className="text-xs text-slate-800 font-bold">{pageCount} Pages</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">FILE SIZE</span>
                <span className="text-xs text-slate-800 font-bold">{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>

          {/* Previews display in Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-3 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block font-sans">Preview Pages</label>
                <span className="text-[10px] text-emerald-600 font-semibold font-sans">✓ Auto Generated & Watermarked</span>
              </div>
              {isGeneratingPreviews && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 font-sans">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting...</span>
                </span>
              )}
            </div>

            {isGeneratingPreviews && (
              <div className="space-y-1 py-1 font-sans">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-550 h-full transition-all duration-300" style={{ width: `${previewProgress}%` }} />
                </div>
              </div>
            )}

            {uploadedPreviewUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {uploadedPreviewUrls.map((url, i) => (
                  <div key={i} className="group relative aspect-[3/4] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover select-none pointer-events-none" />
                    <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono">
                      Page {i+1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !isGeneratingPreviews && (
                <p className="text-[10px] text-slate-400 italic py-1 font-sans">No previews generated yet.</p>
              )
            )}
          </div>

          {/* Upload Progress Bar if active */}
          {isCompiling && (
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Uploading note assets to storage...</span>
                <span>{compilationProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${compilationProgress}%` }} />
              </div>
            </div>
          )}

          {/* Footer Actions Step 3 */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(2)}
              disabled={isCompiling}
              className="py-2.5 px-5 hover:bg-slate-250 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={uploadWizardAssets}
              disabled={isCompiling}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-100"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Assets...</span>
                </>
              ) : (
                <span>Confirm & Upload</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 4: PUBLISH METADATA DETAILS
          ========================================== */}
      {step === 4 && (
        <form onSubmit={handleFinalPublish} className="space-y-6 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Note Title */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Note Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Pathology Lecture Notes — Inflammation & Cell Repair"
                className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs"
              />
            </div>

            {/* Course select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Course *</label>
              {coursesLoading ? (
                <div className="py-2 px-3 bg-slate-100 rounded-xl animate-pulse text-xs text-slate-400">Loading courses...</div>
              ) : (
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Pathology"
                className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs"
              />
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Semester / Year</label>
              <input
                type="text"
                value={semester}
                onChange={e => setSemester(e.target.value)}
                placeholder="e.g. Semester 3"
                className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Price (INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 149"
                className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Status select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Catalogue Visibility</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs"
            >
              <option value="active">Active (Published on store)</option>
              <option value="draft">Draft (Private)</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter topics, diagrams, memory mnemonics covered..."
              className="w-full p-3 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl text-xs resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions Step 4 */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!!note} // Editing skips uploads, so cannot go back to upload
              className="py-2.5 px-5 hover:bg-slate-250 border border-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-100 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{note ? 'Save Updates' : 'Publish Note'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Image Preview Modal Zoom */}
      {zoomImgUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-lg max-h-[85vh] bg-white p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setZoomImgUrl(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900/60 text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={zoomImgUrl} alt="Zoom" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
