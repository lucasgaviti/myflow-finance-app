import {
  SkeletonCard,
} from './Skeleton';

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-kpis">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="page-loader-grid">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonCard />
    </div>
  );
}