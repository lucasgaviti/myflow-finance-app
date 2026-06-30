type SkeletonProps = {
  className?: string;
};

export function Skeleton({
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-icon" />

      <div className="skeleton-stack">
        <Skeleton className="skeleton-line short" />
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-line medium" />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="skeleton-list">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}