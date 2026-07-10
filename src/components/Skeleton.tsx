export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-primary-dark/20 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

export function NoteCardSkeleton() {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-4 bg-white">
      <SkeletonPulse className="w-full aspect-[4/3] rounded-xl" />
      <div className="flex flex-col gap-2">
        <SkeletonPulse className="h-6 w-3/4" />
        <SkeletonPulse className="h-4 w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <SkeletonPulse className="h-6 w-1/4" />
          <SkeletonPulse className="h-9 w-1/3 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function NoteDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 py-8">
      <div className="flex flex-col gap-4">
        <SkeletonPulse className="w-full aspect-[4/3] rounded-2xl" />
        <div className="flex gap-2">
          <SkeletonPulse className="w-20 h-24 rounded-lg" />
          <SkeletonPulse className="w-20 h-24 rounded-lg" />
          <SkeletonPulse className="w-20 h-24 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <SkeletonPulse className="h-10 w-3/4" />
        <SkeletonPulse className="h-4 w-1/4" />
        <SkeletonPulse className="h-24 w-full" />
        <div className="flex gap-4">
          <SkeletonPulse className="h-12 flex-1 rounded-xl" />
          <SkeletonPulse className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
