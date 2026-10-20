export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-1/4 rounded" />
        <div className="skeleton h-4 w-20 rounded-full" />
      </div>
      <div className="skeleton h-6 w-1/3 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  );
}
