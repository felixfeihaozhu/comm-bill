export default function DocumentsLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="border-b border-gray-100 px-4 py-4">
            <div className="flex gap-4 items-center">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


