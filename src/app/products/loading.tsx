export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="h-8 w-48 bg-[#161616] rounded animate-pulse mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[#1E1E1E] bg-[#111111] overflow-hidden">
            <div className="aspect-square bg-[#1E1E1E] animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-[#1E1E1E] rounded animate-pulse" />
              <div className="h-4 bg-[#1E1E1E] rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
