import React, { Suspense } from 'react';
import Schedule from './SpectatorSchedule.jsx';
import { SkeletonCard } from '../components/ui/Skeleton';

const PageSkeleton = () => (
  <div className="space-y-8">
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default function SchedulePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Schedule />
    </Suspense>
  );
}
