import { AlertCircle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import type { DocumentStatus } from '../types';

const statusConfig: Record<
  DocumentStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock3;
    spin?: boolean;
  }
> = {
  pending: {
    label: '等待中',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
    icon: Clock3
  },
  processing: {
    label: '处理中',
    className: 'border-saffron/30 bg-amber-50 text-saffron',
    icon: Loader2,
    spin: true
  },
  ready: {
    label: '可提问',
    className: 'border-fern/25 bg-emerald-50 text-fern',
    icon: CheckCircle2
  },
  failed: {
    label: '失败',
    className: 'border-berry/25 bg-rose-50 text-berry',
    icon: AlertCircle
  }
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded border px-2 text-xs font-medium ${config.className}`}
    >
      <Icon className={config.spin ? 'animate-spin' : undefined} size={13} aria-hidden="true" />
      {config.label}
    </span>
  );
}

