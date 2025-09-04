import React from 'react';

const VideoCardSkeleton = () => (
  <div className="card overflow-hidden animate-pulse">
    {/* Thumbnail skeleton */}
    <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
    
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-1">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Footer skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="card p-6 text-center animate-pulse">
    <div className="h-8 w-8 mx-auto mb-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
  </div>
);

const LoadingSkeleton = ({ type = 'videos', count = 8 }) => {
  if (type === 'categories') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <CategorySkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;