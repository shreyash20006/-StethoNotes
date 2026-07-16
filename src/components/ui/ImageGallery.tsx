import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { optimizeImageUrl } from '../../lib/imageUtils';

export interface GalleryImage {
  url: string;
  label?: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  initialIndex?: number;
  coverLabel?: string;
  className?: string;
  showPinterestGrid?: boolean;
  onImageClick?: (index: number) => void;
}

interface LightboxProps {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const Lightbox = memo(function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const touchStartTime = useRef(0);
  const lastTap = useRef(0);
  const pinchStartDist = useRef(0);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        if (lightboxRef.current?.requestFullscreen) {
          await lightboxRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      await exitFullscreen();
    }
  }, [isFullscreen, exitFullscreen]);

  useEffect(() => {
    setZoom(1);
    setImageLoaded(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(3, z + 0.25));
      if (e.key === '-') setZoom((z) => Math.max(0.5, z - 0.25));
      if (e.key === '0') setZoom(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [index, hasPrev, hasNext, onClose, onNavigate, isFullscreen, exitFullscreen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (pinchStartDist.current > 0) {
        const scale = dist / pinchStartDist.current;
        setZoom((z) => Math.min(3, Math.max(0.5, z * scale)));
        pinchStartDist.current = dist;
      }
      return;
    }
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && touchStartX.current > 0) {
      setZoom((z) => z === 1 ? 2.5 : 1);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    if (touchDeltaX.current > 60 && hasPrev) onNavigate(index - 1);
    else if (touchDeltaX.current < -60 && hasNext) onNavigate(index + 1);
  };

  const handleDoubleClick = () => {
    setZoom((z) => z === 1 ? 2.5 : 1);
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <motion.div
      ref={lightboxRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 sm:p-6 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/70 text-sm font-medium font-sans">
          {current?.label || `Image ${index + 1}`} <span className="text-white/40 mx-1">·</span> <span className="text-white/90 font-semibold">{index + 1}</span>
          <span className="text-white/40 mx-1">/</span>
          <span className="text-white/60">{images.length}</span>
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-white/70 text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center relative px-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {hasPrev && (
          <button
            onClick={() => onNavigate(index - 1)}
            className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <motion.div
          className="relative flex items-center justify-center w-full h-full"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current?.url}
              src={optimizeImageUrl(current?.url || '', { width: 1600 })}
              alt={current?.alt || current?.label || 'Gallery image'}
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain select-none"
              style={{ transform: `scale(${zoom})` }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: zoom }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              draggable={false}
              onLoad={() => setImageLoaded(true)}
            />
          </AnimatePresence>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 animate-pulse" />
            </div>
          )}
        </motion.div>

        {hasNext && (
          <button
            onClick={() => onNavigate(index + 1)}
            className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-4 sm:p-6 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2.5 justify-center min-w-min mx-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                i === index ? 'border-cyan-400 shadow-lg shadow-cyan-400/20 scale-105' : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/40'
              }`}
            >
              <img src={optimizeImageUrl(img.url, { width: 120 })} alt="" className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[8px] font-bold opacity-0 hover:opacity-100 transition-opacity duration-200">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default function ImageGallery({
  images,
  initialIndex = 0,
  coverLabel = 'Cover',
  className = '',
  showPinterestGrid = false,
  onImageClick,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([initialIndex]));

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    onImageClick?.(index);
  }, [onImageClick]);

  useEffect(() => {
    setLoadedImages((prev) => {
      const next = new Set(prev);
      next.add(initialIndex);
      return next;
    });
  }, [initialIndex]);

  if (images.length === 0) return null;

  const cover = images[0];
  const samples = images.slice(1);

  return (
    <div className={`space-y-5 ${className}`}>
      <div
        className="aspect-[4/3] w-full rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative cursor-zoom-in group"
        onClick={() => openLightbox(0)}
      >
        {!loadedImages.has(0) && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse z-10" />
        )}
        <img
          src={optimizeImageUrl(cover.url, { width: 1200 })}
          alt={cover.alt || cover.label || 'Product cover'}
          className="w-full h-full object-contain p-4 transition-all duration-500 group-hover:scale-[1.02]"
          loading="eager"
          onLoad={() => setLoadedImages((prev) => new Set(prev).add(0))}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rotate-[-25deg] text-slate-900/[0.04] font-black text-2xl sm:text-3xl tracking-widest whitespace-nowrap uppercase select-none">
            STETHONOTES PREVIEW
          </div>
        </div>
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg">
          {coverLabel}
        </div>
        <div className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110">
          <ZoomIn className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin">
          {images.map((img, idx) => {
            const isLoaded = loadedImages.has(idx);
            return (
              <button
                key={idx}
                onClick={() => { setActiveIndex(idx); openLightbox(idx); }}
                className={`w-20 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 relative group focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                  activeIndex === idx ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse rounded-2xl z-10" />
                )}
                <img
                  src={optimizeImageUrl(img.url, { width: 160 })}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onLoad={() => setLoadedImages((prev) => new Set(prev).add(idx))}
                />
                <span className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-700 shadow-sm">
                  {idx === 0 ? coverLabel : `Page ${idx}`}
                </span>
                <div className={`absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-300 ${activeIndex === idx ? 'bg-cyan-500/5' : ''}`} />
              </button>
            );
          })}
        </div>
      )}

      {showPinterestGrid && samples.length > 0 && (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {samples.map((img, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
              onClick={() => openLightbox(idx + 1)}
              className="break-inside-avoid w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group relative cursor-zoom-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <img
                src={optimizeImageUrl(img.url, { width: 600 })}
                alt={img.alt || `Sample page ${idx + 1}`}
                className="w-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                {img.label || `Page ${idx + 1}`}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            index={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setActiveIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}