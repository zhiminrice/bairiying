import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg">
      <AlertCircle className="w-5 h-5 text-brand-danger flex-shrink-0" />
      <span className="text-sm text-brand-danger">{message}</span>
    </div>
  );
}
