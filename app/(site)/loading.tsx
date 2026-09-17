import { CardGridSkeleton, Skeleton } from "@/components/ui/Primitives";

export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: "clamp(32px, 6vw, 64px)" }} aria-busy="true">
      <span className="visually-hidden" role="status">
        Loading…
      </span>
      <Skeleton style={{ height: 14, width: 120, marginBottom: 16 }} />
      <Skeleton style={{ height: 52, width: "min(520px, 80%)", marginBottom: 14 }} />
      <Skeleton style={{ height: 18, width: "min(640px, 95%)", marginBottom: 48 }} />
      <CardGridSkeleton count={8} />
    </div>
  );
}
