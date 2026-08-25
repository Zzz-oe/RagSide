import { Database, Settings, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { KnowledgeBase } from '../types';

interface AppShellProps {
  knowledgeBase?: KnowledgeBase;
  onOpenSettings: () => void;
  children: ReactNode;
}

export function AppShell({ knowledgeBase, onOpenSettings, children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-paper text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-5 shadow-panel">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-fern text-white">
            <Database size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight text-ink">{knowledgeBase?.name ?? '默认知识库'}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={13} aria-hidden="true" />
              <span>本地私有 RAG</span>
            </div>
          </div>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded border border-line bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          type="button"
          title="设置"
          aria-label="设置"
          onClick={onOpenSettings}
        >
          <Settings size={18} aria-hidden="true" />
        </button>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
