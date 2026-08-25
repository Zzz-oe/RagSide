import { BookOpen } from 'lucide-react';
import type { SourceReference as SourceReferenceType } from '../types';

interface SourceReferenceProps {
  source: SourceReferenceType;
}

export function SourceReference({ source }: SourceReferenceProps) {
  return (
    <details className="group rounded border border-line bg-white px-3 py-2 text-xs shadow-panel">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-slate-700">
        <BookOpen size={14} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium" title={source.filename}>
          {source.filename}
        </span>
        <span className="shrink-0 text-slate-500">第 {source.page} 页</span>
      </summary>
      <p className="mt-2 line-clamp-5 whitespace-pre-wrap leading-5 text-slate-600">{source.content}</p>
    </details>
  );
}

