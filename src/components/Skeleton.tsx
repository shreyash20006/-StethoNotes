export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-primary-dark/20 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 rounded-2xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-slate-100 rounded-3xl p-5 flex flex-col gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <SkeletonPulse className="w-full aspect-[4/3] rounded-2xl" />
      <div className="flex flex-col gap-3">
        <SkeletonPulse className="h-6 w-3/4 rounded-lg" />
        <SkeletonPulse className="h-4 w-1/2 rounded-lg" />
        <div className="flex justify-between items-center mt-1">
          <SkeletonPulse className="h-7 w-1/4 rounded-lg" />
          <SkeletonPulse className="h-9 w-1/3 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-4">
            <SkeletonPulse className="w-full aspect-[4/3] rounded-3xl shadow-sm" />
            <div className="flex gap-3">
              <SkeletonPulse className="w-20 h-16 rounded-2xl" />
              <SkeletonPulse className="w-20 h-16 rounded-2xl" />
              <SkeletonPulse className="w-20 h-16 rounded-2xl" />
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <SkeletonPulse className="h-8 w-1/2 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/60 rounded-2xl border border-slate-100/50">
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
            </div>
            <SkeletonPulse className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <SkeletonPulse className="h-8 w-1/3 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl flex gap-4">
                  <SkeletonPulse className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonPulse className="h-4 w-3/4 rounded-lg" />
                    <SkeletonPulse className="h-3 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-10 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <SkeletonPulse className="h-7 w-48 rounded-xl" />
                <SkeletonPulse className="h-4 w-32 rounded-lg" />
              </div>
              <SkeletonPulse className="h-8 w-32 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5 bg-slate-50/50 rounded-3xl p-5 border border-slate-100 space-y-4">
                <SkeletonPulse className="h-5 w-1/2 rounded-lg" />
                <SkeletonPulse className="h-24 w-full rounded-xl" />
                <SkeletonPulse className="h-10 w-full rounded-xl" />
              </div>
              <div className="md:col-span-7 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-5 bg-white space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <SkeletonPulse className="w-9 h-9 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1">
                        <SkeletonPulse className="h-4 w-32 rounded-lg" />
                        <SkeletonPulse className="h-3 w-20 rounded-lg" />
                      </div>
                    </div>
                    <SkeletonPulse className="h-16 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-lg shadow-slate-100/50 space-y-6">
            <div className="space-y-3">
              <SkeletonPulse className="h-5 w-24 rounded-lg" />
              <SkeletonPulse className="h-7 w-3/4 rounded-xl" />
              <SkeletonPulse className="h-4 w-1/2 rounded-lg" />
            </div>
            <SkeletonPulse className="h-16 w-full rounded-2xl" />
            <div className="space-y-2">
              <SkeletonPulse className="h-12 w-full rounded-2xl" />
              <SkeletonPulse className="h-12 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <SkeletonPulse className="h-10 w-full rounded-xl" />
              <SkeletonPulse className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


