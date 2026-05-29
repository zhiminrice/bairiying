import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <span className="text-brand-muted text-sm">加载中...</span>
      </div>
    </div>
  );
}
