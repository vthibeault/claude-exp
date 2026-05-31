import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectLoading() {
  return (
    <AppShell>
      <div className="px-6 py-6 space-y-5 max-w-screen-2xl mx-auto">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-full max-w-xs" />
        <Skeleton className="h-96 w-full" />
      </div>
    </AppShell>
  );
}
